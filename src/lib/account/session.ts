import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {connection} from 'next/server';
import {eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {signPending, signSession, verifyPending, verifySession} from './session-token';

export const ACTOR_COOKIE = 'madarth_actor';
/** Password accepted; waiting for the authenticator code / passkey / backup code. */
export const PENDING_COOKIE = 'madarth_actor_2fa';
const MAX_AGE_S = 7 * 24 * 3600;
const PENDING_MAX_AGE_S = 10 * 60;

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

/**
 * Signs the actor in (sets the session cookie). Only call after the second step has passed.
 * Call from a server action or route handler.
 */
export async function startActorSession(account: Pick<ActorAccount, 'id' | 'sessionVersion'>) {
  const jar = await cookies();
  const exp = Date.now() + MAX_AGE_S * 1000;
  jar.set(ACTOR_COOKIE, signSession({aid: account.id, v: account.sessionVersion, exp}), cookieOpts(MAX_AGE_S));
  jar.delete(PENDING_COOKIE);
}

/** Password (or set-password link) accepted: ask for the second step next. */
export async function startPendingSession(account: Pick<ActorAccount, 'id' | 'sessionVersion'>) {
  const jar = await cookies();
  const exp = Date.now() + PENDING_MAX_AGE_S * 1000;
  jar.set(PENDING_COOKIE, signPending({aid: account.id, v: account.sessionVersion, exp}), cookieOpts(PENDING_MAX_AGE_S));
  jar.delete(ACTOR_COOKIE);
}

export async function endActorSession() {
  const jar = await cookies();
  jar.delete(ACTOR_COOKIE);
  jar.delete(PENDING_COOKIE);
}

/** Account waiting for its second sign-in step, or null. */
export async function getPendingAccount(): Promise<ActorAccount | null> {
  await connection();
  const payload = verifyPending((await cookies()).get(PENDING_COOKIE)?.value);
  if (!payload) return null;
  const [account] = await getDb()
    .select()
    .from(schema.actorAccounts)
    .where(eq(schema.actorAccounts.id, payload.aid))
    .limit(1);
  if (!account || account.sessionVersion !== payload.v || !account.passwordHash) return null;
  return account;
}

/**
 * The signed-in actor account, or null. Re-checks the account and session version on every call,
 * and requires two-factor to be set up (sessions are only issued after the second step).
 */
export async function getActorAccount(): Promise<ActorAccount | null> {
  await connection();
  const payload = verifySession((await cookies()).get(ACTOR_COOKIE)?.value);
  if (!payload) return null;
  const [account] = await getDb()
    .select()
    .from(schema.actorAccounts)
    .where(eq(schema.actorAccounts.id, payload.aid))
    .limit(1);
  if (!account || account.sessionVersion !== payload.v || !account.passwordHash || !account.totpEnabledAt) return null;
  return account;
}

export async function requireActorAccount(): Promise<ActorAccount> {
  const account = await getActorAccount();
  if (!account) redirect('/account/login');
  return account;
}

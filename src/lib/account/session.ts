import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {connection} from 'next/server';
import {eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {signSession, verifySession} from './session-token';

export const ACTOR_COOKIE = 'madarth_actor';
const MAX_AGE_S = 7 * 24 * 3600;

/** Signs the actor in (sets the session cookie). Call from a server action or route handler. */
export async function startActorSession(account: Pick<ActorAccount, 'id' | 'sessionVersion'>) {
  const exp = Date.now() + MAX_AGE_S * 1000;
  (await cookies()).set(ACTOR_COOKIE, signSession({aid: account.id, v: account.sessionVersion, exp}), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function endActorSession() {
  (await cookies()).delete(ACTOR_COOKIE);
}

/** The signed-in actor account, or null. Re-checks the account and session version on every call. */
export async function getActorAccount(): Promise<ActorAccount | null> {
  await connection();
  const payload = verifySession((await cookies()).get(ACTOR_COOKIE)?.value);
  if (!payload) return null;
  const [account] = await getDb()
    .select()
    .from(schema.actorAccounts)
    .where(eq(schema.actorAccounts.id, payload.aid))
    .limit(1);
  if (!account || account.sessionVersion !== payload.v || !account.passwordHash) return null;
  return account;
}

export async function requireActorAccount(): Promise<ActorAccount> {
  const account = await getActorAccount();
  if (!account) redirect('/account/login');
  return account;
}

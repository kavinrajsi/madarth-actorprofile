import 'server-only';
import {connection} from 'next/server';
import {and, desc, eq, gt, isNull, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {sendAndLog} from '@/lib/email/send';
import {inviteEmail, thankYouEmail} from '@/lib/email/templates';
import {siteUrl} from '@/lib/site-url';
import {hashToken, newToken, TOKEN_TTL_MS} from './tokens';

type Purpose = 'setup' | 'reset' | 'email_change';
const {actorAccounts, accountTokens, actors} = schema;

export async function findAccountByEmail(email: string): Promise<ActorAccount | null> {
  const [a] = await getDb()
    .select()
    .from(actorAccounts)
    .where(eq(actorAccounts.email, email.trim().toLowerCase()))
    .limit(1);
  return a ?? null;
}

/** Get or create the account for an email (one account per address). */
export async function ensureAccount(email: string): Promise<ActorAccount> {
  const e = email.trim().toLowerCase();
  await getDb().insert(actorAccounts).values({email: e}).onConflictDoNothing();
  const a = await findAccountByEmail(e);
  if (!a) throw new Error('Account could not be created');
  return a;
}

/** Issues a new single-use token; earlier unused tokens of the same purpose stop working. */
export async function issueToken(accountId: string, purpose: Purpose, newEmail?: string): Promise<string> {
  const db = getDb();
  const {token, hash} = newToken();
  await db.batch([
    db
      .update(accountTokens)
      .set({usedAt: new Date()})
      .where(and(eq(accountTokens.accountId, accountId), eq(accountTokens.purpose, purpose), isNull(accountTokens.usedAt))),
    db.insert(accountTokens).values({
      accountId,
      purpose,
      tokenHash: hash,
      newEmail: newEmail ?? null,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
    }),
  ]);
  return token;
}

/** Looks a token up without using it (to decide whether to show a form). */
export async function peekToken(token: string, purpose: Purpose) {
  // Compares against the current time, so this must run per request (not during prerender).
  await connection();
  if (!token || token.length > 100) return null;
  const [row] = await getDb()
    .select({accountId: accountTokens.accountId, email: actorAccounts.email, newEmail: accountTokens.newEmail})
    .from(accountTokens)
    .innerJoin(actorAccounts, eq(actorAccounts.id, accountTokens.accountId))
    .where(
      and(
        eq(accountTokens.tokenHash, hashToken(token)),
        eq(accountTokens.purpose, purpose),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Atomically marks a token used. Returns its account id (and new email) only if it was valid. */
export async function consumeToken(token: string, purpose: Purpose) {
  if (!token || token.length > 100) return null;
  const [row] = await getDb()
    .update(accountTokens)
    .set({usedAt: new Date()})
    .where(
      and(
        eq(accountTokens.tokenHash, hashToken(token)),
        eq(accountTokens.purpose, purpose),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date()),
      ),
    )
    .returning({accountId: accountTokens.accountId, newEmail: accountTokens.newEmail});
  return row ?? null;
}

export async function sendSetupInvite(account: ActorAccount, name: string, actorId?: string) {
  const token = await issueToken(account.id, 'setup');
  const days = Math.round(TOKEN_TTL_MS.setup / 86_400_000);
  return sendAndLog({
    to: account.email,
    toName: name,
    kind: 'invite',
    actorId,
    email: inviteEmail({name, email: account.email, link: `${siteUrl()}/account/setup?token=${token}`, days}),
  });
}

/**
 * After a profile is submitted: 1) thank-you email, 2) account invitation (only if the account
 * has no password yet). Runs after the response via `after()`; never throws.
 */
export async function sendRegistrationEmails(actorId: string) {
  try {
    const [actor] = await getDb()
      .select({id: actors.id, name: actors.fullName, email: actors.email, code: actors.actorCode})
      .from(actors)
      .where(eq(actors.id, actorId))
      .limit(1);
    if (!actor) return;
    const first = actor.name.split(' ')[0] || actor.name;
    const account = await ensureAccount(actor.email);

    await sendAndLog({
      to: actor.email,
      toName: actor.name,
      kind: 'thank_you',
      actorId,
      email: thankYouEmail({name: first, code: actor.code, hasAccount: Boolean(account.passwordHash), loginUrl: `${siteUrl()}/account/login`}),
    });
    if (!account.passwordHash) await sendSetupInvite(account, first, actorId);
  } catch (err) {
    console.error('[email] registration emails failed:', err instanceof Error ? err.name : 'unknown');
  }
}

/** Profiles owned by an account (every submission made with its email), newest first. */
export async function profilesForAccount(email: string) {
  return getDb()
    .select()
    .from(actors)
    .where(sql`lower(${actors.email}) = ${email.toLowerCase()}`)
    .orderBy(desc(actors.createdAt));
}

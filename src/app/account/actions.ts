'use server';

import {redirect} from 'next/navigation';
import {del} from '@vercel/blob';
import {and, eq, sql} from 'drizzle-orm';
import {z} from 'zod';
import {getDb, schema} from '@/db';
import {checkNewPhoto, PHOTO_ORDER, profileFields} from '@/lib/actor-fields';
import {hashPassword, passwordProblem, verifyPassword} from '@/lib/account/password';
import {
  consumeToken,
  ensureAccount,
  findAccountByEmail,
  issueToken,
  profilesForAccount,
  sendSetupInvite,
} from '@/lib/account/service';
import {endActorSession, requireActorAccount, startActorSession} from '@/lib/account/session';
import {TOKEN_TTL_MS} from '@/lib/account/tokens';
import {sendAndLog} from '@/lib/email/send';
import {passwordResetEmail} from '@/lib/email/templates';
import {safeError} from '@/lib/log';
import {rateLimit} from '@/lib/rate-limit';
import {siteUrl} from '@/lib/site-url';
import {fieldErrors, submissionSchema, type SubmissionInput} from '@/lib/validation';

export type ActionResult = {ok: true} | {ok: false; message: string; fieldErrors?: Record<string, string>};

const {actorAccounts, actors, actorPhotos} = schema;
const emailSchema = z.email().max(200);
// Used to keep timing similar when an account does not exist.
const DUMMY_HASH = 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==';

// ── Sign in / out ────────────────────────────────────────────────────────────

export async function loginAction(rawEmail: string, password: string): Promise<ActionResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!emailSchema.safeParse(email).success || !password) {
    return {ok: false, message: 'Enter your email and password.'};
  }
  if (!(await rateLimit('actor-login', 10, 15 * 60))) {
    return {ok: false, message: 'Too many attempts. Please wait 15 minutes and try again.'};
  }
  const account = await findAccountByEmail(email);
  const valid = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH);
  if (!account || !account.passwordHash || !valid) {
    return {ok: false, message: 'Email or password is incorrect.'};
  }
  await getDb().update(actorAccounts).set({lastLoginAt: new Date()}).where(eq(actorAccounts.id, account.id));
  await startActorSession(account);
  return {ok: true};
}

export async function logoutAction() {
  await endActorSession();
  redirect('/account/login');
}

// ── Set / reset password ─────────────────────────────────────────────────────

async function setPasswordWithToken(
  token: string,
  purpose: 'setup' | 'reset',
  password: string,
  confirm: string,
): Promise<ActionResult> {
  const problem = passwordProblem(password);
  if (problem) return {ok: false, message: problem, fieldErrors: {password: problem}};
  if (password !== confirm) {
    return {ok: false, message: 'Passwords do not match.', fieldErrors: {confirm: 'Passwords do not match'}};
  }
  const used = await consumeToken(token, purpose);
  if (!used) return {ok: false, message: 'This link has expired or was already used. Request a new one.'};

  const [account] = await getDb()
    .update(actorAccounts)
    .set({
      passwordHash: await hashPassword(password),
      passwordSetAt: new Date(),
      lastLoginAt: new Date(),
      // Signs out any other sessions.
      sessionVersion: sql`${actorAccounts.sessionVersion} + 1`,
    })
    .where(eq(actorAccounts.id, used.accountId))
    .returning();
  if (!account) return {ok: false, message: 'Account not found.'};
  await startActorSession(account);
  return {ok: true};
}

export async function setupPasswordAction(token: string, password: string, confirm: string) {
  return setPasswordWithToken(token, 'setup', password, confirm);
}

export async function resetPasswordAction(token: string, password: string, confirm: string) {
  return setPasswordWithToken(token, 'reset', password, confirm);
}

/** Always answers the same way, so it can't be used to find out who is registered. */
export async function forgotPasswordAction(rawEmail: string): Promise<ActionResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) return {ok: false, message: 'Enter a valid email address.'};
  if (!(await rateLimit('actor-forgot', 5, 3600))) {
    return {ok: false, message: 'Too many requests. Please try again in an hour.'};
  }
  try {
    const account = await findAccountByEmail(email);
    if (account?.passwordHash) {
      const token = await issueToken(account.id, 'reset');
      await sendAndLog({
        to: account.email,
        kind: 'password_reset',
        email: passwordResetEmail({
          link: `${siteUrl()}/account/reset?token=${token}`,
          minutes: Math.round(TOKEN_TTL_MS.reset / 60_000),
        }),
      });
    } else {
      // No password yet (or no account at all, e.g. registered before accounts existed):
      // if there is a profile with this email, send a fresh setup invitation.
      const [p] = await profilesForAccount(email);
      if (p) {
        const acc = account ?? (await ensureAccount(email));
        await sendSetupInvite(acc, p.fullName.split(' ')[0] || p.fullName, p.id);
      }
    }
  } catch (err) {
    console.error('[account] forgot password failed:', safeError(err));
  }
  return {ok: true};
}

// ── Profile edit / delete ────────────────────────────────────────────────────

async function ownedProfile(accountEmail: string, code: string) {
  const [actor] = await getDb()
    .select()
    .from(actors)
    .where(and(eq(actors.actorCode, code), sql`lower(${actors.email}) = ${accountEmail}`))
    .limit(1);
  return actor ?? null;
}

export async function updateProfileAction(code: string, input: SubmissionInput): Promise<ActionResult> {
  const account = await requireActorAccount();
  const actor = await ownedProfile(account.email, code);
  if (!actor) return {ok: false, message: 'Profile not found.'};

  // The email on a profile is the login email; it is changed only via the confirmation flow.
  const parsed = submissionSchema.safeParse({...input, email: actor.email, consent: true});
  if (!parsed.success) {
    return {ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error)};
  }
  const v = parsed.data;

  const db = getDb();
  const current = await db.select().from(actorPhotos).where(eq(actorPhotos.actorId, actor.id));
  const byId = new Map(current.map((p) => [p.id, p]));

  const keep: (typeof current)[number][] = [];
  const added: typeof v.photos = [];
  for (const p of v.photos) {
    if (p.id) {
      const existing = byId.get(p.id);
      if (!existing || existing.kind !== p.kind) return {ok: false, message: 'One of the photos is invalid. Please reload and try again.'};
      keep.push(existing);
    } else {
      const problem = await checkNewPhoto(p, v.draftId);
      if (problem) return {ok: false, message: problem};
      added.push(p);
    }
  }
  const keptIds = new Set(keep.map((p) => p.id));
  const removed = current.filter((p) => !keptIds.has(p.id));

  const rows = [
    ...keep.map((p) => ({kind: p.kind, blobPathname: p.blobPathname, contentType: p.contentType, sizeBytes: p.sizeBytes})),
    ...added.map((p) => ({kind: p.kind, blobPathname: p.pathname, contentType: p.contentType, sizeBytes: p.size})),
  ]
    .sort((a, b) => PHOTO_ORDER[a.kind] - PHOTO_ORDER[b.kind])
    .map((p, i) => ({...p, actorId: actor.id, sort: i}));

  try {
    await db.batch([
      db.update(actors).set({...profileFields(v), updatedAt: new Date()}).where(eq(actors.id, actor.id)),
      db.delete(actorPhotos).where(eq(actorPhotos.actorId, actor.id)),
      db.insert(actorPhotos).values(rows),
    ]);
  } catch (err) {
    console.error('[account] profile update failed:', safeError(err));
    return {ok: false, message: 'Something went wrong while saving. Please try again.'};
  }
  if (removed.length) {
    await del(removed.map((p) => p.blobPathname)).catch((err) => console.warn('[account] blob cleanup failed:', safeError(err)));
  }
  return {ok: true};
}

export async function deleteProfileAction(code: string, confirmText: string): Promise<ActionResult> {
  const account = await requireActorAccount();
  if (confirmText.trim().toUpperCase() !== 'DELETE') {
    return {ok: false, message: 'Type DELETE to confirm.', fieldErrors: {confirm: 'Type DELETE to confirm'}};
  }
  const actor = await ownedProfile(account.email, code);
  if (!actor) return {ok: false, message: 'Profile not found.'};

  const db = getDb();
  const photos = await db.select({pathname: actorPhotos.blobPathname}).from(actorPhotos).where(eq(actorPhotos.actorId, actor.id));
  try {
    // Photos and status history are removed by ON DELETE CASCADE.
    await db.delete(actors).where(eq(actors.id, actor.id));
  } catch (err) {
    console.error('[account] profile delete failed:', safeError(err));
    return {ok: false, message: 'Something went wrong. Please try again or email us.'};
  }
  if (photos.length) {
    await del(photos.map((p) => p.pathname)).catch((err) => console.warn('[account] blob cleanup failed:', safeError(err)));
  }

  const remaining = await profilesForAccount(account.email);
  if (remaining.length === 0) {
    await db.delete(actorAccounts).where(eq(actorAccounts.id, account.id));
    await endActorSession();
  }
  return {ok: true};
}


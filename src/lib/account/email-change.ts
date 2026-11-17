import 'server-only';
import {eq, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {safeError} from '@/lib/log';
import {consumeToken, findAccountByEmail} from './service';

const {actorAccounts, actors} = schema;

/** Applies a confirmed email change. Returns a login-page notice code. */
export async function applyEmailChange(token: string): Promise<'email-changed' | 'email-taken' | 'link-expired' | 'email-change-failed'> {
  const used = await consumeToken(token, 'email_change');
  if (!used?.newEmail) return 'link-expired';
  const db = getDb();
  const [account] = await db.select().from(actorAccounts).where(eq(actorAccounts.id, used.accountId)).limit(1);
  if (!account) return 'link-expired';
  if (await findAccountByEmail(used.newEmail)) return 'email-taken';
  try {
    await db.batch([
      db.update(actors).set({email: used.newEmail, updatedAt: new Date()}).where(sql`lower(${actors.email}) = ${account.email}`),
      // Bumping the session version signs the actor out everywhere; they sign in with the new email.
      db
        .update(actorAccounts)
        .set({email: used.newEmail, sessionVersion: sql`${actorAccounts.sessionVersion} + 1`})
        .where(eq(actorAccounts.id, account.id)),
    ]);
  } catch (err) {
    console.error('[account] email change failed:', safeError(err));
    return 'email-change-failed';
  }
  return 'email-changed';
}

import 'server-only';
import QRCode from 'qrcode';
import {and, eq, isNull, lt, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {generateBackupCodes, hashBackupCode, normalizeBackupCode} from './backup-codes';
import {decryptSecret, encryptSecret} from './mfa-crypto';
import {formatManualKey, generateTotpSecret, matchTotp, otpauthUri} from './totp';

const {actorAccounts, actorBackupCodes, actorPasskeys} = schema;

/** Authenticator code check. Atomic: a code's time step can be accepted only once. */
export async function verifyAuthenticatorCode(account: ActorAccount, code: string): Promise<boolean> {
  if (!account.totpSecret) return false;
  const step = matchTotp(decryptSecret(account.totpSecret), code);
  if (step === null) return false;
  const rows = await getDb()
    .update(actorAccounts)
    .set({totpLastStep: step})
    .where(and(eq(actorAccounts.id, account.id), lt(actorAccounts.totpLastStep, step)))
    .returning({id: actorAccounts.id});
  return rows.length > 0;
}

/** Marks a backup code used. Atomic: each code works once. */
export async function redeemBackupCode(accountId: string, input: string): Promise<boolean> {
  const normalized = normalizeBackupCode(input);
  if (!normalized) return false;
  const rows = await getDb()
    .update(actorBackupCodes)
    .set({usedAt: new Date()})
    .where(
      and(
        eq(actorBackupCodes.accountId, accountId),
        eq(actorBackupCodes.codeHash, hashBackupCode(normalized)),
        isNull(actorBackupCodes.usedAt),
      ),
    )
    .returning({id: actorBackupCodes.id});
  return rows.length > 0;
}

/** Accepts a 6-digit authenticator code or a backup code. */
export async function verifySecondFactor(account: ActorAccount, input: string): Promise<'totp' | 'backup' | null> {
  const value = input.trim();
  if (/^\d{3}\s?\d{3}$/.test(value)) return (await verifyAuthenticatorCode(account, value)) ? 'totp' : null;
  return (await redeemBackupCode(account.id, value)) ? 'backup' : null;
}

/** Starts (or restarts) authenticator setup. The new secret only becomes active once confirmed. */
export async function beginTotpSetup(account: ActorAccount): Promise<{qr: string; manualKey: string}> {
  const secret = generateTotpSecret();
  await getDb()
    .update(actorAccounts)
    .set({totpPendingSecret: encryptSecret(secret)})
    .where(eq(actorAccounts.id, account.id));
  // Rendered here: the otpauth URI contains the secret, so it never goes to a third-party QR service.
  const svg = await QRCode.toString(otpauthUri(secret, account.email), {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {dark: '#000000', light: '#ffffff'},
  });
  return {qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, manualKey: formatManualKey(secret)};
}

/**
 * Activates the pending secret if the code matches, and issues fresh backup codes.
 * Replacing an existing authenticator also signs out other sessions (sessionVersion + 1).
 */
export async function confirmTotpSetup(
  account: ActorAccount,
  code: string,
): Promise<{account: ActorAccount; backupCodes: string[]} | null> {
  const pending = account.totpPendingSecret;
  if (!pending) return null;
  const step = matchTotp(decryptSecret(pending), code);
  if (step === null) return null;
  const db = getDb();
  const [updated] = await db
    .update(actorAccounts)
    .set({
      totpSecret: pending,
      totpPendingSecret: null,
      totpEnabledAt: new Date(),
      totpLastStep: step,
      sessionVersion: account.totpEnabledAt ? sql`${actorAccounts.sessionVersion} + 1` : actorAccounts.sessionVersion,
    })
    .where(and(eq(actorAccounts.id, account.id), eq(actorAccounts.totpPendingSecret, pending)))
    .returning();
  if (!updated) return null;
  const backupCodes = await replaceBackupCodes(account.id);
  return {account: updated, backupCodes};
}

export async function replaceBackupCodes(accountId: string): Promise<string[]> {
  const db = getDb();
  const codes = generateBackupCodes();
  await db.batch([
    db.delete(actorBackupCodes).where(eq(actorBackupCodes.accountId, accountId)),
    db.insert(actorBackupCodes).values(
      codes.map((c) => ({accountId, codeHash: hashBackupCode(normalizeBackupCode(c)!)})),
    ),
  ]);
  return codes;
}

export async function backupCodesLeft(accountId: string): Promise<number> {
  const [row] = await getDb()
    .select({n: sql<number>`count(*)::int`})
    .from(actorBackupCodes)
    .where(and(eq(actorBackupCodes.accountId, accountId), isNull(actorBackupCodes.usedAt)));
  return row?.n ?? 0;
}

/** Admin recovery: removes the authenticator, backup codes and passkeys, and signs the actor out. */
export async function resetTwoFactor(accountId: string) {
  const db = getDb();
  await db.batch([
    db
      .update(actorAccounts)
      .set({
        totpSecret: null,
        totpPendingSecret: null,
        totpEnabledAt: null,
        totpLastStep: 0,
        sessionVersion: sql`${actorAccounts.sessionVersion} + 1`,
      })
      .where(eq(actorAccounts.id, accountId)),
    db.delete(actorBackupCodes).where(eq(actorBackupCodes.accountId, accountId)),
    db.delete(actorPasskeys).where(eq(actorPasskeys.accountId, accountId)),
  ]);
}

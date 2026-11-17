'use server';

import {after} from 'next/server';
import {and, eq} from 'drizzle-orm';
import type {AuthenticationResponseJSON, RegistrationResponseJSON} from '@simplewebauthn/server';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {
  beginTotpSetup,
  confirmTotpSetup,
  replaceBackupCodes,
  verifySecondFactor,
} from '@/lib/account/mfa';
import {getActorAccount, getPendingAccount, startActorSession} from '@/lib/account/session';
import {
  listPasskeys,
  MAX_PASSKEYS,
  passkeyAuthenticationOptions,
  passkeyRegistrationOptions,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from '@/lib/account/webauthn';
import {sendAndLog} from '@/lib/email/send';
import {securityEmail} from '@/lib/email/templates';
import {LEGAL} from '@/lib/legal';
import {safeError} from '@/lib/log';
import {recordHit, underLimit} from '@/lib/rate-limit';
import {siteUrl} from '@/lib/site-url';

type Fail = {ok: false; message: string};
const fail = (message: string): Fail => ({ok: false, message});
const EXPIRED = fail('Your sign-in timed out. Please sign in again.');
const TOO_MANY = fail('Too many attempts. Please wait 15 minutes and try again.');
const WRONG_CODE = fail('That code is not right. Check your authenticator app and try again.');

/** 5 wrong second-step attempts per 15 minutes per account, whatever the IP. Correct codes don't count. */
const attemptAllowed = (accountId: string) => underLimit(`mfa:${accountId}`, 5, 15 * 60);
const recordFailure = (accountId: string) => recordHit(`mfa:${accountId}`);

function notify(account: ActorAccount, heading: string, message: string) {
  after(() =>
    sendAndLog({
      to: account.email,
      kind: 'security',
      email: securityEmail({heading, message, loginUrl: `${siteUrl()}/account`, contactEmail: LEGAL.privacyEmail}),
    }),
  );
}

async function finishSignIn(account: ActorAccount) {
  await getDb()
    .update(schema.actorAccounts)
    .set({lastLoginAt: new Date()})
    .where(eq(schema.actorAccounts.id, account.id));
  await startActorSession(account);
}

// ── Second step at sign-in ───────────────────────────────────────────────────

/** Authenticator code or backup code after the password. */
export async function verifySignInCodeAction(code: string): Promise<{ok: true} | Fail> {
  const account = await getPendingAccount();
  if (!account || !account.totpEnabledAt) return EXPIRED;
  if (!code.trim()) return fail('Enter the 6-digit code from your authenticator app.');
  if (!(await attemptAllowed(account.id))) return TOO_MANY;
  const used = await verifySecondFactor(account, code);
  if (!used) {
    await recordFailure(account.id);
    return WRONG_CODE;
  }
  await finishSignIn(account);
  if (used === 'backup') {
    notify(account, 'A backup code was used', 'Someone signed in to your Madarth Casting account with one of your backup codes.');
  }
  return {ok: true};
}

export async function passkeySignInOptionsAction() {
  const account = await getPendingAccount();
  if (!account || !account.totpEnabledAt) return EXPIRED;
  const options = await passkeyAuthenticationOptions(account);
  return options ? {ok: true as const, options} : fail('Passkeys are not available here. Use your authenticator code.');
}

export async function passkeySignInVerifyAction(response: AuthenticationResponseJSON): Promise<{ok: true} | Fail> {
  const account = await getPendingAccount();
  if (!account || !account.totpEnabledAt) return EXPIRED;
  if (!(await attemptAllowed(account.id))) return TOO_MANY;
  let verified = false;
  try {
    verified = await verifyPasskeyAuthentication(account, response);
  } catch (err) {
    console.error('passkey sign-in failed:', safeError(err));
  }
  if (!verified) {
    await recordFailure(account.id);
    return fail('That passkey did not work. Try again or use your code.');
  }
  await finishSignIn(account);
  return {ok: true};
}

// ── Authenticator setup / replacement ────────────────────────────────────────

/**
 * First-time setup (from the pending sign-in step) needs no code. Replacing an authenticator
 * from a signed-in account needs a current authenticator or backup code.
 */
export async function startAuthenticatorSetupAction(
  currentCode?: string,
): Promise<{ok: true; qr: string; manualKey: string} | Fail> {
  const signedIn = await getActorAccount();
  let account: ActorAccount | null = signedIn;
  if (signedIn) {
    if (!(await attemptAllowed(signedIn.id))) return TOO_MANY;
    if (!currentCode || !(await verifySecondFactor(signedIn, currentCode))) {
      if (currentCode) await recordFailure(signedIn.id);
      return fail('Enter a current code from your authenticator app (or a backup code) to continue.');
    }
  } else {
    account = await getPendingAccount();
    if (!account) return EXPIRED;
    if (account.totpEnabledAt) return fail('Two-factor is already set up. Enter your code to sign in.');
  }
  const {qr, manualKey} = await beginTotpSetup(account!);
  return {ok: true, qr, manualKey};
}

export async function confirmAuthenticatorAction(code: string): Promise<{ok: true; backupCodes: string[]} | Fail> {
  // Replacing needs a full session; first-time setup happens from the pending sign-in step.
  const signedIn = await getActorAccount();
  const pending = signedIn ? null : await getPendingAccount();
  const account = signedIn ?? (pending && !pending.totpEnabledAt ? pending : null);
  if (!account) return EXPIRED;
  if (!account.totpPendingSecret) return fail('Setup expired. Start again.');
  if (!(await attemptAllowed(account.id))) return TOO_MANY;
  const replacing = Boolean(account.totpEnabledAt);
  const done = await confirmTotpSetup(account, code);
  if (!done) {
    await recordFailure(account.id);
    return WRONG_CODE;
  }
  await finishSignIn(done.account);
  notify(
    account,
    replacing ? 'Authenticator app changed' : 'Two-factor sign-in turned on',
    replacing
      ? 'A new authenticator app was set up for your Madarth Casting account. Other devices were signed out.'
      : 'Your Madarth Casting account now asks for a code from your authenticator app when you sign in.',
  );
  return {ok: true, backupCodes: done.backupCodes};
}

// ── Backup codes ─────────────────────────────────────────────────────────────

export async function regenerateBackupCodesAction(code: string): Promise<{ok: true; backupCodes: string[]} | Fail> {
  const account = await getActorAccount();
  if (!account) return EXPIRED;
  if (!(await attemptAllowed(account.id))) return TOO_MANY;
  if (!(await verifySecondFactor(account, code))) {
    await recordFailure(account.id);
    return WRONG_CODE;
  }
  const backupCodes = await replaceBackupCodes(account.id);
  notify(account, 'New backup codes created', 'New backup codes were created for your Madarth Casting account. The old ones no longer work.');
  return {ok: true, backupCodes};
}

// ── Passkeys (signed in) ─────────────────────────────────────────────────────

export async function passkeyRegisterOptionsAction() {
  const account = await getActorAccount();
  if (!account) return EXPIRED;
  if ((await listPasskeys(account.id)).length >= MAX_PASSKEYS) return fail(`You can add up to ${MAX_PASSKEYS} passkeys.`);
  const options = await passkeyRegistrationOptions(account);
  return options
    ? {ok: true as const, options}
    : fail('Passkeys can only be added on casting.madarth.com.');
}

export async function passkeyRegisterVerifyAction(response: RegistrationResponseJSON, rawName: string): Promise<{ok: true} | Fail> {
  const account = await getActorAccount();
  if (!account) return EXPIRED;
  const name = rawName.trim().slice(0, 60) || 'Passkey';
  try {
    if (!(await verifyPasskeyRegistration(account, response, name))) return fail('Could not add that passkey. Please try again.');
  } catch (err) {
    console.error('passkey registration failed:', safeError(err));
    return fail('Could not add that passkey. Please try again.');
  }
  notify(account, 'Passkey added', `A passkey ("${name}") was added to your Madarth Casting account for signing in.`);
  return {ok: true};
}

export async function removePasskeyAction(id: string): Promise<{ok: true} | Fail> {
  const account = await getActorAccount();
  if (!account) return EXPIRED;
  const [removed] = await getDb()
    .delete(schema.actorPasskeys)
    .where(and(eq(schema.actorPasskeys.id, id), eq(schema.actorPasskeys.accountId, account.id)))
    .returning({name: schema.actorPasskeys.name});
  if (!removed) return fail('Passkey not found.');
  notify(account, 'Passkey removed', `The passkey "${removed.name}" was removed from your Madarth Casting account.`);
  return {ok: true};
}

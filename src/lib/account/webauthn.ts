import 'server-only';
import {cookies, headers} from 'next/headers';
import {and, eq} from 'drizzle-orm';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {getDb, schema} from '@/db';
import type {ActorAccount} from '@/db/schema';
import {signChallenge, verifyChallenge, type ChallengePayload} from './session-token';

const {actorPasskeys} = schema;
const CHALLENGE_COOKIE = 'madarth_webauthn';
const CHALLENGE_TTL_S = 5 * 60;
export const MAX_PASSKEYS = 10;

/**
 * Passkeys are bound to a domain. Only these hosts can use them (never derived from an
 * arbitrary Host header); on any other host (e.g. the vercel.app URL) passkeys are hidden.
 */
export async function passkeyRelyingParty(): Promise<{rpID: string; origin: string} | null> {
  const host = ((await headers()).get('host') ?? '').toLowerCase();
  if (host === 'casting.madarth.com') return {rpID: 'casting.madarth.com', origin: 'https://casting.madarth.com'};
  if (process.env.NODE_ENV !== 'production' && /^localhost(:\d+)?$/.test(host)) {
    return {rpID: 'localhost', origin: `http://${host}`};
  }
  return null;
}

async function setChallenge(p: Omit<ChallengePayload, 'exp'>) {
  (await cookies()).set(CHALLENGE_COOKIE, signChallenge({...p, exp: Date.now() + CHALLENGE_TTL_S * 1000}), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CHALLENGE_TTL_S,
  });
}

/** Reads and deletes the challenge (single use). */
async function takeChallenge(aid: string, purpose: ChallengePayload['purpose']): Promise<string | null> {
  const jar = await cookies();
  const c = verifyChallenge(jar.get(CHALLENGE_COOKIE)?.value);
  jar.delete(CHALLENGE_COOKIE);
  if (!c || c.aid !== aid || c.purpose !== purpose) return null;
  return c.challenge;
}

export async function listPasskeys(accountId: string) {
  return getDb()
    .select({
      id: actorPasskeys.id,
      credentialId: actorPasskeys.credentialId,
      transports: actorPasskeys.transports,
      name: actorPasskeys.name,
      createdAt: actorPasskeys.createdAt,
      lastUsedAt: actorPasskeys.lastUsedAt,
    })
    .from(actorPasskeys)
    .where(eq(actorPasskeys.accountId, accountId))
    .orderBy(actorPasskeys.createdAt);
}

export async function passkeyRegistrationOptions(account: ActorAccount) {
  const rp = await passkeyRelyingParty();
  if (!rp) return null;
  const existing = await listPasskeys(account.id);
  const options = await generateRegistrationOptions({
    rpName: 'Madarth Casting',
    rpID: rp.rpID,
    userName: account.email,
    userDisplayName: account.email,
    userID: new Uint8Array(Buffer.from(account.id.replace(/-/g, ''), 'hex')),
    attestationType: 'none',
    excludeCredentials: existing.map((p) => ({id: p.credentialId, transports: p.transports as AuthenticatorTransport[]})),
    authenticatorSelection: {residentKey: 'preferred', userVerification: 'required'},
  });
  await setChallenge({aid: account.id, purpose: 'register', challenge: options.challenge});
  return options;
}

export async function verifyPasskeyRegistration(account: ActorAccount, response: RegistrationResponseJSON, name: string) {
  const rp = await passkeyRelyingParty();
  const challenge = await takeChallenge(account.id, 'register');
  if (!rp || !challenge) return false;
  const {verified, registrationInfo} = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
    requireUserVerification: true,
  });
  if (!verified || !registrationInfo) return false;
  const {credential} = registrationInfo;
  await getDb()
    .insert(actorPasskeys)
    .values({
      accountId: account.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports ?? [],
      name,
    });
  return true;
}

export async function passkeyAuthenticationOptions(account: ActorAccount) {
  const rp = await passkeyRelyingParty();
  if (!rp) return null;
  const keys = await listPasskeys(account.id);
  if (!keys.length) return null;
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    allowCredentials: keys.map((p) => ({id: p.credentialId, transports: p.transports as AuthenticatorTransport[]})),
    userVerification: 'required',
  });
  await setChallenge({aid: account.id, purpose: 'authenticate', challenge: options.challenge});
  return options;
}

export async function verifyPasskeyAuthentication(account: ActorAccount, response: AuthenticationResponseJSON) {
  const rp = await passkeyRelyingParty();
  const challenge = await takeChallenge(account.id, 'authenticate');
  if (!rp || !challenge || typeof response?.id !== 'string') return false;
  const db = getDb();
  const [key] = await db
    .select()
    .from(actorPasskeys)
    .where(and(eq(actorPasskeys.accountId, account.id), eq(actorPasskeys.credentialId, response.id)))
    .limit(1);
  if (!key) return false;
  const {verified, authenticationInfo} = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
    credential: {
      id: key.credentialId,
      publicKey: new Uint8Array(Buffer.from(key.publicKey, 'base64url')),
      counter: key.counter,
      transports: key.transports as AuthenticatorTransport[],
    },
    requireUserVerification: true,
  });
  if (!verified) return false;
  // Synced passkeys always report 0; store whatever the authenticator reports.
  await db
    .update(actorPasskeys)
    .set({counter: authenticationInfo.newCounter, lastUsedAt: new Date()})
    .where(eq(actorPasskeys.id, key.id));
  return true;
}

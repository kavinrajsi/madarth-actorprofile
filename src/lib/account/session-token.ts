import {createHmac, timingSafeEqual} from 'node:crypto';

/**
 * Signed, stateless tokens: base64url(JSON payload) + "." + HMAC-SHA256.
 * Each kind uses its own derived key, so one kind can never be replayed as another.
 */
export type SessionPayload = {aid: string; v: number; exp: number};
/** Password checked, second step still required (short-lived). */
export type PendingPayload = SessionPayload;
/** WebAuthn ceremony challenge bound to an account and purpose. */
export type ChallengePayload = {aid: string; purpose: 'register' | 'authenticate'; challenge: string; exp: number};

// v2: only issued after two-factor sign-in, so every pre-2FA session is invalid.
const LABELS = {session: 'actor-session-v2', pending: 'actor-mfa-pending-v1', challenge: 'actor-webauthn-v1'} as const;
type Kind = keyof typeof LABELS;

const keyFor = (kind: Kind) => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  // Domain-separate from Auth.js usage of the same secret.
  return createHmac('sha256', s).update(LABELS[kind]).digest();
};

function sign(kind: Kind, payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', keyFor(kind)).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(kind: Kind, value: string | undefined, now: number): Record<string, unknown> | null {
  if (!value) return null;
  const [body, mac] = value.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', keyFor(kind)).update(body).digest();
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>;
    if (typeof p.exp !== 'number' || p.exp < now) return null;
    return p;
  } catch {
    return null;
  }
}

function asSession(p: Record<string, unknown> | null): SessionPayload | null {
  if (!p || typeof p.aid !== 'string' || typeof p.v !== 'number') return null;
  return {aid: p.aid, v: p.v, exp: p.exp as number};
}

export const signSession = (p: SessionPayload) => sign('session', p);
export const verifySession = (value: string | undefined, now = Date.now()) => asSession(verify('session', value, now));

export const signPending = (p: PendingPayload) => sign('pending', p);
export const verifyPending = (value: string | undefined, now = Date.now()) => asSession(verify('pending', value, now));

export const signChallenge = (p: ChallengePayload) => sign('challenge', p);
export function verifyChallenge(value: string | undefined, now = Date.now()): ChallengePayload | null {
  const p = verify('challenge', value, now);
  if (!p || typeof p.aid !== 'string' || typeof p.challenge !== 'string') return null;
  if (p.purpose !== 'register' && p.purpose !== 'authenticate') return null;
  return {aid: p.aid, purpose: p.purpose, challenge: p.challenge, exp: p.exp as number};
}

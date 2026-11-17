import {createHmac, timingSafeEqual} from 'node:crypto';

/** Signed, stateless actor session: base64url(JSON payload) + "." + HMAC-SHA256. */
export type SessionPayload = {aid: string; v: number; exp: number};

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  // Domain-separate from Auth.js usage of the same secret.
  return createHmac('sha256', s).update('actor-session-v1').digest();
};

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySession(value: string | undefined, now = Date.now()): SessionPayload | null {
  if (!value) return null;
  const [body, mac] = value.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', secret()).update(body).digest();
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof p.aid !== 'string' || typeof p.v !== 'number' || typeof p.exp !== 'number') return null;
    if (p.exp < now) return null;
    return p;
  } catch {
    return null;
  }
}

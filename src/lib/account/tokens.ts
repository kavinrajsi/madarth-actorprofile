import {createHash, randomBytes} from 'node:crypto';

/** A URL-safe random token (sent by email) and its SHA-256 hash (stored in the database). */
export function newToken(): {token: string; hash: string} {
  const token = randomBytes(32).toString('base64url');
  return {token, hash: hashToken(token)};
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const TOKEN_TTL_MS = {
  setup: 7 * 24 * 3600 * 1000,
  reset: 60 * 60 * 1000,
  email_change: 24 * 3600 * 1000,
} as const;

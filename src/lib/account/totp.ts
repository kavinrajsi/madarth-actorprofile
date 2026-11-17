import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';

/** RFC 6238 time-based one-time passwords (Google Authenticator compatible: SHA-1, 6 digits, 30 s). */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_PERIOD_S = 30;

export function base32Encode(buf: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** New 160-bit secret, base32 encoded. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** RFC 4226 HOTP value for a counter. */
export function hotp(secret: Buffer, counter: number, digits = 6, algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha1'): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac(algorithm, secret).update(msg).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export function timeStep(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000 / TOTP_PERIOD_S);
}

/**
 * Checks a 6-digit code against the current step and one step either side (clock drift).
 * Returns the matching step, or null. The caller must reject steps it has already accepted.
 */
export function matchTotp(secretB32: string, code: string, nowMs = Date.now()): number | null {
  const digits = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(digits)) return null;
  const secret = base32Decode(secretB32);
  const now = timeStep(nowMs);
  let match: number | null = null;
  for (const step of [now - 1, now, now + 1]) {
    const expected = Buffer.from(hotp(secret, step));
    // Check every candidate so timing doesn't reveal which step matched.
    if (timingSafeEqual(expected, Buffer.from(digits)) && match === null) match = step;
  }
  return match;
}

/** otpauth:// URI for authenticator apps (shown only as a QR code / manual key). */
export function otpauthUri(secretB32: string, accountEmail: string, issuer = 'Madarth Casting'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({secret: secretB32, issuer, algorithm: 'SHA1', digits: '6', period: String(TOTP_PERIOD_S)});
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Groups a base32 secret in blocks of 4 for typing by hand. */
export function formatManualKey(secretB32: string): string {
  return secretB32.match(/.{1,4}/g)?.join(' ') ?? secretB32;
}

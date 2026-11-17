import {describe, expect, it, beforeAll} from 'vitest';
import {base32Decode, base32Encode, generateTotpSecret, hotp, matchTotp, otpauthUri, timeStep} from './totp';
import {decryptSecret, encryptSecret} from './mfa-crypto';
import {generateBackupCodes, hashBackupCode, normalizeBackupCode} from './backup-codes';

describe('TOTP (RFC 6238)', () => {
  // RFC 6238 Appendix B, SHA-1 seed, 8 digits.
  const seed = Buffer.from('12345678901234567890');
  const vectors: [number, string][] = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ];
  it.each(vectors)('time %i -> %s', (t, expected) => {
    expect(hotp(seed, Math.floor(t / 30), 8)).toBe(expected);
  });

  it('RFC 4226 HOTP 6-digit vectors', () => {
    const want = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
    want.forEach((w, i) => expect(hotp(seed, i)).toBe(w));
  });

  it('base32 round-trips and matches the RFC seed encoding', () => {
    expect(base32Encode(seed)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode('GEZD GNBV-GY3TQOJQGEZDGNBVGY3TQOJQ').equals(seed)).toBe(true);
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(s)).toHaveLength(20);
  });

  it('accepts the current step and one either side, rejects further drift', () => {
    const secret = base32Encode(seed);
    const now = 1_700_000_000_000;
    const step = timeStep(now);
    const code = (s: number) => hotp(seed, s);
    expect(matchTotp(secret, code(step), now)).toBe(step);
    expect(matchTotp(secret, code(step - 1), now)).toBe(step - 1);
    expect(matchTotp(secret, code(step + 1), now)).toBe(step + 1);
    expect(matchTotp(secret, code(step - 2), now)).toBeNull();
    expect(matchTotp(secret, code(step + 2), now)).toBeNull();
  });

  it('rejects malformed codes and tolerates spaces', () => {
    const secret = base32Encode(seed);
    const now = 1_700_000_000_000;
    const c = hotp(seed, timeStep(now));
    expect(matchTotp(secret, `${c.slice(0, 3)} ${c.slice(3)}`, now)).toBe(timeStep(now));
    expect(matchTotp(secret, '12345', now)).toBeNull();
    expect(matchTotp(secret, 'abcdef', now)).toBeNull();
    expect(matchTotp(secret, '', now)).toBeNull();
  });

  it('builds an otpauth URI', () => {
    const uri = otpauthUri('ABCDEFGH', 'a@b.com');
    expect(uri.startsWith('otpauth://totp/Madarth%20Casting%3Aa%40b.com?')).toBe(true);
    expect(uri).toContain('secret=ABCDEFGH');
    expect(uri).toContain('issuer=Madarth+Casting');
  });
});

describe('secret encryption', () => {
  beforeAll(() => {
    process.env.MFA_ENCRYPTION_KEY = 'test-key-0123456789abcdef0123456789abcdef';
  });

  it('round-trips and uses a fresh IV each time', () => {
    const a = encryptSecret('JBSWY3DPEHPK3PXP');
    const b = encryptSecret('JBSWY3DPEHPK3PXP');
    expect(a).not.toBe(b);
    expect(a.startsWith('v1.')).toBe(true);
    expect(decryptSecret(a)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rejects tampered ciphertext', () => {
    const [v, iv, tag, ct] = encryptSecret('JBSWY3DPEHPK3PXP').split('.');
    const flipped = Buffer.from(ct, 'base64url');
    flipped[0] ^= 1;
    expect(() => decryptSecret([v, iv, tag, flipped.toString('base64url')].join('.'))).toThrow();
  });

  it('fails with a different key', () => {
    const enc = encryptSecret('JBSWY3DPEHPK3PXP');
    process.env.MFA_ENCRYPTION_KEY = 'another-key-0123456789abcdef0123456789abc';
    expect(() => decryptSecret(enc)).toThrow();
    process.env.MFA_ENCRYPTION_KEY = 'test-key-0123456789abcdef0123456789abcdef';
  });
});

describe('backup codes', () => {
  it('generates 10 unique XXXXX-XXXXX codes', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
  });

  it('normalizes input and hashes deterministically', () => {
    expect(normalizeBackupCode(' abcde-fghjk ')).toBe('ABCDEFGHJK');
    expect(normalizeBackupCode('ABCDE FGHJK')).toBe('ABCDEFGHJK');
    expect(normalizeBackupCode('123456')).toBeNull();
    expect(hashBackupCode('ABCDEFGHJK')).toBe(hashBackupCode('ABCDEFGHJK'));
    expect(hashBackupCode('ABCDEFGHJK')).not.toBe(hashBackupCode('ABCDEFGHJL'));
  });
});

describe('token kinds are not interchangeable', async () => {
  const {signSession, verifySession, signPending, verifyPending, signChallenge, verifyChallenge} = await import('./session-token');
  process.env.AUTH_SECRET ??= 'test-auth-secret-for-vitest-only';
  const p = {aid: '00000000-0000-0000-0000-000000000001', v: 1, exp: Date.now() + 60_000};

  it('pending token is not a session and vice versa', () => {
    expect(verifyPending(signPending(p))).toEqual(p);
    expect(verifySession(signPending(p))).toBeNull();
    expect(verifyPending(signSession(p))).toBeNull();
  });

  it('challenge token round-trips and is bound to its kind', () => {
    const c = {aid: p.aid, purpose: 'authenticate' as const, challenge: 'abc', exp: p.exp};
    expect(verifyChallenge(signChallenge(c))).toEqual(c);
    expect(verifySession(signChallenge(c))).toBeNull();
    expect(verifyChallenge(signChallenge({...c, exp: Date.now() - 1}))).toBeNull();
  });
});

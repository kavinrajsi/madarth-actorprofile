import {beforeAll, describe, expect, it} from 'vitest';
import {inviteEmail, thankYouEmail} from '../email/templates';
import {hashPassword, passwordProblem, verifyPassword} from './password';
import {signSession, verifySession} from './session-token';
import {hashToken, newToken} from './tokens';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-for-unit-tests-only-0123456789';
});

describe('passwords', () => {
  it('hashes with a random salt and verifies only the right password', async () => {
    const a = await hashPassword('Casting2026');
    const b = await hashPassword('Casting2026');
    expect(a).toMatch(/^scrypt\$\d+\$8\$1\$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword('Casting2026', a)).toBe(true);
    expect(await verifyPassword('casting2026', a)).toBe(false);
    expect(await verifyPassword('Casting2026', null)).toBe(false);
    expect(await verifyPassword('Casting2026', 'garbage')).toBe(false);
  });

  it('enforces simple strength rules', () => {
    expect(passwordProblem('short1')).toMatch(/8 characters/);
    expect(passwordProblem('onlyletters')).toMatch(/letter and one number/);
    expect(passwordProblem('12345678')).toMatch(/letter and one number/);
    expect(passwordProblem('x'.repeat(129) + '1')).toMatch(/at most/);
    expect(passwordProblem('Madarth2026')).toBeNull();
  });
});

describe('one-time tokens', () => {
  it('returns a random URL-safe token and stores only its hash', () => {
    const t1 = newToken();
    const t2 = newToken();
    expect(t1.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(t1.token).not.toBe(t2.token);
    expect(t1.hash).toBe(hashToken(t1.token));
    expect(t1.hash).not.toContain(t1.token);
  });
});

describe('actor session cookie', () => {
  const payload = {aid: '3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e', v: 1, exp: Date.now() + 60_000};

  it('round-trips a valid session', () => {
    expect(verifySession(signSession(payload))).toEqual(payload);
  });

  it('rejects tampering, wrong secret, expiry and junk', () => {
    const value = signSession(payload);
    const [body, mac] = value.split('.');
    const forged = Buffer.from(JSON.stringify({...payload, aid: 'someone-else'})).toString('base64url');
    expect(verifySession(`${forged}.${mac}`)).toBeNull();
    expect(verifySession(`${body}.${mac.slice(0, -2)}xx`)).toBeNull();
    expect(verifySession(signSession({...payload, exp: Date.now() - 1}))).toBeNull();
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession('not-a-session')).toBeNull();

    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'a-different-secret-value-9876543210';
    expect(verifySession(value)).toBeNull();
    process.env.AUTH_SECRET = original;
  });
});

describe('email templates', () => {
  it('include the actor ID and escape user-provided text', () => {
    const t = thankYouEmail({name: '<script>alert(1)</script>', code: 'MAD-26-00042'});
    expect(t.subject).toContain('MAD-26-00042');
    expect(t.html).toContain('MAD-26-00042');
    expect(t.html).not.toContain('<script>');
    expect(t.html).toContain('&lt;script&gt;');
    expect(t.text).toContain('MAD-26-00042');
  });

  it('invite contains the link, login email and expiry', () => {
    const link = 'https://madarth-actorprofile.vercel.app/account/setup?token=abc_123';
    const t = inviteEmail({name: 'Priya', email: 'priya@example.com', link, days: 7});
    expect(t.html).toContain(link);
    expect(t.text).toContain(link);
    expect(t.html).toContain('priya@example.com');
    expect(t.text).toMatch(/expires in 7 days/);
  });

  it('thank-you tells existing account holders to sign in instead of waiting for an invite', () => {
    const t = thankYouEmail({name: 'Priya', code: 'MAD-26-00043', hasAccount: true, loginUrl: 'https://x.test/account/login'});
    expect(t.text).toContain('You already have an account');
    expect(t.text).not.toContain('separate email');
  });
});

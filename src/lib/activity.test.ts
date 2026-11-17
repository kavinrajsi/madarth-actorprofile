import {describe, expect, it} from 'vitest';
import {ACTIVITY_ACTIONS, describeActivity, formatLocation, parseDevice} from './activity-actions';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  winFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
};

describe('parseDevice', () => {
  it.each([
    [UA.iphoneSafari, 'Safari on iPhone'],
    [UA.iphoneChrome, 'Chrome on iPhone'],
    [UA.androidChrome, 'Chrome on Android'],
    [UA.samsung, 'Samsung Internet on Android'],
    [UA.macChrome, 'Chrome on Mac'],
    [UA.macSafari, 'Safari on Mac'],
    [UA.winEdge, 'Edge on Windows'],
    [UA.winFirefox, 'Firefox on Windows'],
  ])('%#', (ua, expected) => expect(parseDevice(ua)).toBe(expected));

  it('handles missing and unknown agents', () => {
    expect(parseDevice(null)).toBeNull();
    expect(parseDevice('')).toBeNull();
    expect(parseDevice('curl/8.4.0')).toBe('Unknown device');
  });
});

describe('formatLocation', () => {
  it('decodes Vercel city header and joins parts', () => {
    expect(formatLocation('Chennai', 'TN', 'IN')).toBe('Chennai, TN, IN');
    expect(formatLocation('S%C3%A3o%20Paulo', 'SP', 'BR')).toBe('São Paulo, SP, BR');
    expect(formatLocation(null, null, 'IN')).toBe('IN');
    expect(formatLocation(null, null, null)).toBeNull();
    expect(formatLocation('%E0%A4', null, 'IN')).toBe('%E0%A4, IN');
  });
});

const entry = (over: Partial<Parameters<typeof describeActivity>[0]>) => ({
  actorType: 'actor' as const,
  action: 'sign_in',
  adminEmail: null,
  subjectCode: 'MAD-26-00001',
  details: null,
  ...over,
});

describe('describeActivity', () => {
  it('covers every action for admins', () => {
    for (const action of Object.keys(ACTIVITY_ACTIONS)) {
      const v = describeActivity(entry({action, actorType: action.startsWith('admin') ? 'admin' : 'actor'}), 'admin');
      expect(v?.text, action).toBeTruthy();
    }
  });

  it('describes sign-in method and failures', () => {
    expect(describeActivity(entry({details: {method: 'passkey'}}), 'actor')?.text).toBe('Signed in with fingerprint / Face ID');
    expect(describeActivity(entry({details: {method: 'backup'}}), 'actor')?.text).toBe('Signed in with backup code');
    const failed = describeActivity(entry({action: 'sign_in_failed', details: {step: 'code'}}), 'actor');
    expect(failed?.text).toBe('Failed sign-in (wrong code)');
    expect(failed?.isWarning).toBe(true);
    expect(describeActivity(entry({action: 'sign_in_failed', details: {reason: 'rate_limited'}}), 'actor')?.text).toMatch(/blocked/);
  });

  it('lists changed field labels and photo counts, never values', () => {
    const v = describeActivity(
      entry({action: 'profile_updated', details: {fields: ['city', 'phone', 'secretThing'], photosAdded: 1, photosRemoved: 2}}),
      'actor',
    );
    expect(v?.text).toBe('Updated profile: city, contact number; 1 photo added; 2 photos removed');
  });

  it('hides admin-only events and admin identity from actors', () => {
    for (const action of ['profile_viewed', 'notes_saved', 'admin_sign_in', 'member_added']) {
      expect(describeActivity(entry({actorType: 'admin', action, adminEmail: 'a@madarth.com'}), 'actor'), action).toBeNull();
    }
    const status = describeActivity(
      entry({actorType: 'admin', action: 'status_changed', adminEmail: 'a@madarth.com', details: {from: 'new', to: 'shortlisted'}}),
      'actor',
    );
    expect(status?.text).toBe('Casting status changed to Shortlisted');
    expect(status?.text).not.toContain('madarth.com');
    // The admin's device/IP must not be shown to the actor.
    expect(status?.showDevice).toBe(false);
    expect(describeActivity(entry({actorType: 'admin', action: 'two_factor_reset'}), 'actor')?.text).toMatch(/casting team/);
  });

  it('shows internal status labels to admins', () => {
    const v = describeActivity(entry({actorType: 'admin', action: 'status_changed', details: {from: 'new', to: 'not_suitable'}}), 'admin');
    expect(v?.text).toMatch(/→/);
    expect(v?.showDevice).toBe(true);
  });
});

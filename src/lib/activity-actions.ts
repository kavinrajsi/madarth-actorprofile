import type {ActorStatus} from '@/db/schema';
import {ACTOR_STATUS_LABEL} from '@/lib/account/status-label';
import {STATUS_LABEL} from '@/lib/constants';

/** Every action the activity log records. Stored as text, so adding one needs no migration. */
export const ACTIVITY_ACTIONS = {
  // Actor
  sign_in: 'Signed in',
  sign_in_failed: 'Failed sign-in attempt',
  sign_out: 'Signed out',
  password_set: 'Created password',
  password_reset: 'Reset password',
  password_reset_requested: 'Requested a password reset link',
  two_factor_enabled: 'Turned on two-factor sign-in',
  authenticator_changed: 'Changed authenticator app',
  backup_codes_regenerated: 'Created new backup codes',
  passkey_added: 'Added a passkey',
  passkey_removed: 'Removed a passkey',
  profile_submitted: 'Registered profile',
  profile_updated: 'Updated profile',
  profile_deleted: 'Deleted profile',
  // Admin
  admin_sign_in: 'Admin signed in',
  admin_sign_in_denied: 'Admin sign-in denied',
  admin_sign_out: 'Admin signed out',
  status_changed: 'Changed casting status',
  notes_saved: 'Edited internal notes',
  invite_resent: 'Re-sent account invitation',
  two_factor_reset: 'Reset two-factor',
  member_added: 'Added team member',
  member_removed: 'Removed team member',
  profile_viewed: 'Viewed profile',
} as const;

export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;

/** Admin actions an actor may see about their own profile (without who did it). */
export const ACTOR_VISIBLE_ADMIN_ACTIONS = ['status_changed', 'invite_resent', 'two_factor_reset'] as const;
const actorVisibleAdmin = new Set<string>(ACTOR_VISIBLE_ADMIN_ACTIONS);

const METHOD: Record<string, string> = {totp: 'authenticator code', backup: 'backup code', passkey: 'fingerprint / Face ID'};
const STEP: Record<string, string> = {password: 'wrong password', code: 'wrong code', passkey: 'passkey failed'};

/** Human labels for profile fields named in `profile_updated` details. */
export const FIELD_LABEL: Record<string, string> = {
  fullName: 'name',
  dateOfBirth: 'date of birth',
  gender: 'gender',
  city: 'city',
  phone: 'contact number',
  whatsapp: 'WhatsApp',
  guardianName: 'guardian name',
  guardianPhone: 'guardian phone',
  instagramUrl: 'Instagram',
  youtubeUrl: 'YouTube',
  facebookUrl: 'Facebook',
  otherSocialLinks: 'other social links',
  intro: 'introduction',
  experience: 'acting experience',
  portfolioLinks: 'portfolio links',
  showreelUrls: 'showreel links',
  languages: 'languages',
  heightCm: 'height',
  profession: 'profession',
  availability: 'availability',
  willingToTravel: 'travel',
};

export type ActivityView = {
  text: string;
  /** Highlight (e.g. failed sign-ins). */
  isWarning: boolean;
  /** Device / location / IP belong to the person who acted; hidden when that's an admin and the reader is the actor. */
  showDevice: boolean;
};

type EntryLike = {
  actorType: 'actor' | 'admin' | 'system';
  action: string;
  adminEmail: string | null;
  subjectCode: string | null;
  details: Record<string, unknown> | null;
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** One readable line for an entry, or null when this audience must not see it. */
export function describeActivity(e: EntryLike, audience: 'actor' | 'admin'): ActivityView | null {
  const d = e.details ?? {};
  if (audience === 'actor' && e.actorType === 'admin' && !actorVisibleAdmin.has(e.action)) return null;
  const isActorReader = audience === 'actor';
  const base = ACTIVITY_ACTIONS[e.action as ActivityAction] ?? e.action;
  let text: string = base;

  switch (e.action) {
    case 'sign_in':
      text = METHOD[str(d.method)] ? `Signed in with ${METHOD[str(d.method)]}` : 'Signed in';
      break;
    case 'sign_in_failed':
      text = d.reason === 'rate_limited' ? 'Sign-in blocked after too many attempts' : `Failed sign-in (${STEP[str(d.step)] ?? 'not verified'})`;
      break;
    case 'passkey_added':
    case 'passkey_removed':
      text = str(d.name) ? `${base}: ${str(d.name)}` : base;
      break;
    case 'profile_updated': {
      const fields = (Array.isArray(d.fields) ? d.fields : []).map((f) => FIELD_LABEL[str(f)]).filter(Boolean);
      const parts: string[] = [];
      if (fields.length) parts.push(fields.join(', '));
      if (Number(d.photosAdded)) parts.push(`${plural(Number(d.photosAdded), 'photo')} added`);
      if (Number(d.photosRemoved)) parts.push(`${plural(Number(d.photosRemoved), 'photo')} removed`);
      text = parts.length ? `Updated profile: ${parts.join('; ')}` : 'Saved profile (no changes)';
      break;
    }
    case 'status_changed': {
      const to = str(d.to) as ActorStatus;
      if (isActorReader) {
        text = `Casting status changed to ${ACTOR_STATUS_LABEL[to]?.label ?? to}`;
      } else {
        const from = str(d.from) as ActorStatus;
        text = `Changed status ${STATUS_LABEL[from] ?? from} → ${STATUS_LABEL[to] ?? to}`;
      }
      break;
    }
    case 'invite_resent':
      text = isActorReader ? 'Account invitation re-sent by the casting team' : base;
      break;
    case 'two_factor_reset':
      text = isActorReader ? 'Two-factor sign-in reset by the casting team' : base;
      break;
    case 'member_added':
    case 'member_removed':
    case 'admin_sign_in_denied':
      text = str(d.email) ? `${base}: ${str(d.email)}` : base;
      break;
  }

  return {
    text,
    isWarning: e.action === 'sign_in_failed' || e.action === 'admin_sign_in_denied',
    showDevice: !(isActorReader && e.actorType !== 'actor'),
  };
}

/** "Chrome on iPhone" from a user-agent string (no dependency; good enough for a log). */
export function parseDevice(ua: string | null | undefined): string | null {
  if (!ua) return null;
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser\//.test(ua)
        ? 'Samsung Internet'
        : /FxiOS\/|Firefox\//.test(ua)
          ? 'Firefox'
          : /CriOS\/|Chrome\//.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : null;
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Macintosh|Mac OS X/.test(ua)
              ? 'Mac'
              : /Linux/.test(ua)
                ? 'Linux'
                : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? 'Unknown device';
}

/** "Chennai, TN, IN" from Vercel's geo headers (city is URL-encoded). */
export function formatLocation(city: string | null, region: string | null, country: string | null): string | null {
  let c = city ?? '';
  try {
    c = decodeURIComponent(c);
  } catch {
    // keep raw
  }
  const parts = [c, region, country].map((p) => (p ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

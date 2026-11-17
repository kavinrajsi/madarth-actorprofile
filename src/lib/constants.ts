import type {ActorStatus, Gender, PhotoKind} from '@/db/schema';

export const CONSENT_VERSION = '2026-11-v1';

export const CONSENT_TEXT =
  'I give Madarth permission to store and use the photographs and details I have submitted for casting purposes, and to contact me about casting opportunities.';

export const GUARDIAN_CONSENT_TEXT =
  'I am the parent or legal guardian of this actor and I give the same permission on their behalf.';

export const GENDER_OPTIONS: {value: Gender; label: string}[] = [
  {value: 'female', label: 'Female'},
  {value: 'male', label: 'Male'},
  {value: 'non_binary', label: 'Non-binary'},
  {value: 'other', label: 'Other'},
  {value: 'prefer_not', label: 'Prefer not to say'},
];

export const GENDER_LABEL: Record<Gender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Gender, string>;

export const STATUS_OPTIONS: {value: ActorStatus; label: string}[] = [
  {value: 'new', label: 'New'},
  {value: 'shortlisted', label: 'Shortlisted'},
  {value: 'contacted', label: 'Contacted'},
  {value: 'selected', label: 'Selected'},
  {value: 'not_suitable', label: 'Not suitable'},
];

export const STATUS_LABEL: Record<ActorStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ActorStatus, string>;

export const LANGUAGES = [
  'Tamil',
  'English',
  'Hindi',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Urdu',
  'Odia',
  'Sourashtra',
  'French',
  'Arabic',
];

export const COMMON_CITIES = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Vellore',
  'Puducherry',
  'Bengaluru',
  'Hyderabad',
  'Kochi',
  'Thiruvananthapuram',
  'Mumbai',
  'Delhi',
  'Kolkata',
  'Pune',
];

export const PHOTO_RULES: Record<PhotoKind, {label: string; min: number; max: number}> = {
  headshot: {label: 'Front-facing headshot', min: 1, max: 1},
  gallery: {label: 'Recent best pictures', min: 0, max: 4},
  full_length: {label: 'Full-length photograph', min: 0, max: 1},
};

export const PHOTO_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIN_SHORT_SIDE = 600;

export const ADMIN_PAGE_SIZE = 25;

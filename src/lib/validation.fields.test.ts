import {describe, expect, it} from 'vitest';
import {fieldErrors, submissionSchema, type SubmissionInput} from './validation';

/**
 * Field-by-field checks for the registration form.
 * For every input: valid values must produce NO error on that field,
 * invalid values must produce the expected error message on that field.
 */

const draftId = '3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e';
const headshot = {kind: 'headshot' as const, pathname: `submissions/${draftId}/headshot-a.jpg`, contentType: 'image/jpeg', size: 2048};
const year = new Date().getFullYear();
const adultDob = `${year - 25}-06-15`;
const minorDob = `${year - 16}-01-01`;

/** A complete, valid adult submission. Each test changes one field. */
const base = (): SubmissionInput => ({
  draftId,
  fullName: 'Priya Raman',
  dateOfBirth: adultDob,
  gender: 'female',
  city: 'Chennai',
  phone: '+91 98765 43210',
  whatsapp: '98765 43210',
  email: 'priya@example.com',
  instagramHandle: '@priya',
  instagramUrl: 'https://instagram.com/priya',
  youtubeUrl: '',
  facebookUrl: '',
  otherSocialLinks: [],
  photos: [headshot],
  intro: 'Theatre actor from Chennai.',
  experience: '',
  portfolioLinks: [],
  showreelUrls: [],
  languages: ['Tamil'],
  heightCm: '',
  profession: '',
  availability: '',
  willingToTravel: 'yes',
  consent: true,
  website: '',
});

const errorsFor = (patch: Partial<SubmissionInput>) => {
  const r = submissionSchema.safeParse({...base(), ...patch});
  return r.success ? {} : fieldErrors(r.error);
};

type Case = {
  field: string;
  /** Error key to look at (defaults to `field`). */
  key?: string;
  valid: unknown[];
  invalid: [value: unknown, message: RegExp][];
  /** Extra fields to set with every value (e.g. a minor's date of birth). */
  with?: Partial<SubmissionInput>;
};

const cases: Case[] = [
  {
    field: 'fullName',
    valid: ['Priya', 'A. R. Rahman', 'பிரியா ராமன்', 'x'.repeat(120)],
    invalid: [
      ['', /full name is required/i],
      ['   ', /full name is required/i],
      ['x'.repeat(121), /under 120/i],
    ],
  },
  {
    field: 'dateOfBirth',
    valid: [adultDob, `${year - 99}-01-01`, `${year - 18}-01-01`],
    invalid: [
      ['', /date of birth is required/i],
      ['15/03/2000', /valid date of birth/i],
      ['2001-02-30', /valid date of birth/i],
      ['2999-01-01', /future/i],
      ['1900-01-01', /valid date of birth/i],
    ],
  },
  {
    field: 'gender',
    valid: ['female', 'male', 'non_binary', 'other', 'prefer_not'],
    invalid: [
      ['', /select a gender/i],
      ['robot', /select a gender/i],
    ],
  },
  {
    field: 'city',
    valid: ['Chennai', 'New Delhi', 'Thiruvananthapuram'],
    invalid: [
      ['', /city is required/i],
      ['x'.repeat(81), /under 80/i],
    ],
  },
  {
    field: 'phone',
    valid: ['9876543210', '+91 98765 43210', '+91-98765-43210', '(044) 2345 6789'],
    invalid: [
      ['', /contact number is required/i],
      ['12345', /10–15 digits/i],
      ['98765abcde', /valid contact number/i],
      ['1'.repeat(16), /10–15 digits/i],
    ],
  },
  {
    field: 'whatsapp',
    valid: ['9876543210', '+44 7700 900123'],
    invalid: [
      ['', /whatsapp number is required/i],
      ['123', /Enter a valid WhatsApp number \(10–15 digits\)/],
    ],
  },
  {
    field: 'email',
    valid: ['priya@example.com', 'PRIYA.R+cast@Example.co.in'],
    invalid: [
      ['', /email id is required/i],
      ['priya', /valid email/i],
      ['priya@', /valid email/i],
      ['priya@example', /valid email/i],
    ],
  },
  {
    field: 'instagramHandle',
    valid: ['', '@priya', 'priya.r_23'],
    invalid: [['x'.repeat(61), /under 60/i]],
  },
  {
    field: 'instagramUrl',
    valid: ['', 'https://instagram.com/priya', 'https://www.instagram.com/priya/'],
    invalid: [
      ['instagram.com/priya', /full link/i],
      ['https://facebook.com/priya', /^Enter an Instagram link/],
    ],
  },
  {
    field: 'youtubeUrl',
    valid: ['', 'https://www.youtube.com/@priya', 'https://youtu.be/abc123', 'https://m.youtube.com/watch?v=1'],
    invalid: [
      ['youtube.com/@priya', /full link/i],
      ['https://vimeo.com/123', /^Enter a YouTube link/],
      ['https://notyoutube.com/x', /youtube link/i],
    ],
  },
  {
    field: 'facebookUrl',
    valid: ['', 'https://facebook.com/priya', 'https://m.facebook.com/priya', 'https://fb.com/priya'],
    invalid: [
      ['facebook.com/priya', /full link/i],
      ['https://instagram.com/priya', /facebook link/i],
    ],
  },
  {
    field: 'otherSocialLinks',
    key: 'otherSocialLinks.0',
    valid: [[], ['https://x.com/priya'], ['https://www.imdb.com/name/nm1', 'https://linkedin.com/in/priya']],
    invalid: [
      [['x.com/priya'], /full link/i],
      [['not a link'], /full link/i],
    ],
  },
  {
    field: 'otherSocialLinks',
    valid: [Array(5).fill('https://x.com/a')],
    invalid: [[Array(6).fill('https://x.com/a'), /up to 5/i]],
  },
  {
    field: 'intro',
    valid: ['Hi', 'x'.repeat(1500)],
    invalid: [
      ['', /introduction is required/i],
      ['x'.repeat(1501), /under 1500/i],
    ],
  },
  {
    field: 'experience',
    valid: ['', 'Lead in short film "Kaatru", 2024.'],
    invalid: [['x'.repeat(4001), /under 4000/i]],
  },
  {
    field: 'portfolioLinks',
    key: 'portfolioLinks.0',
    valid: [[], ['https://youtube.com/watch?v=1'], ['https://drive.google.com/file/d/1']],
    invalid: [[['youtube.com/x'], /full link/i]],
  },
  {
    field: 'portfolioLinks',
    valid: [Array(10).fill('https://a.com')],
    invalid: [[Array(11).fill('https://a.com'), /up to 10/i]],
  },
  {
    field: 'showreelUrls',
    key: 'showreelUrls.0',
    valid: [[], ['https://youtu.be/reel'], ['https://vimeo.com/1', 'https://drive.google.com/x']],
    invalid: [[['vimeo.com/1'], /full link/i]],
  },
  {
    field: 'showreelUrls',
    valid: [Array(5).fill('https://vimeo.com/1')],
    invalid: [[Array(6).fill('https://vimeo.com/1'), /up to 5/i]],
  },
  {
    field: 'languages',
    valid: [['Tamil'], ['Tamil', 'English', 'Hindi'], ['Sourashtra']],
    invalid: [[[], /at least one language/i]],
  },
  {
    field: 'heightCm',
    valid: ['', 165, 50, 250, '172'],
    invalid: [
      [49, /height in cm/i],
      [251, /height in cm/i],
      [165.5, /./],
    ],
  },
  {
    field: 'profession',
    valid: ['', 'Software engineer'],
    invalid: [['x'.repeat(121), /under 120/i]],
  },
  {
    field: 'availability',
    valid: ['', 'Weekends only'],
    invalid: [['x'.repeat(301), /under 300/i]],
  },
  {
    field: 'willingToTravel',
    valid: ['yes', 'no'],
    invalid: [
      ['', /yes or no/i],
      ['maybe', /yes or no/i],
    ],
  },
  {
    field: 'consent',
    valid: [true],
    invalid: [[false, /consent/i]],
  },
  {
    field: 'website',
    valid: ['', undefined],
    invalid: [['https://spam.example', /./]],
  },
  // Guardian fields only apply to under-18s.
  {
    field: 'guardianName',
    with: {dateOfBirth: minorDob, guardianPhone: '9876500000', guardianConsent: true},
    valid: ['Ravi Raman'],
    invalid: [
      ['', /guardian name is required/i],
      [undefined, /guardian name is required/i],
    ],
  },
  {
    field: 'guardianPhone',
    with: {dateOfBirth: minorDob, guardianName: 'Ravi', guardianConsent: true},
    valid: ['9876500000', '+91 98765 00000'],
    invalid: [
      ['', /guardian phone is required/i],
      ['123', /10–15 digits/i],
    ],
  },
  {
    field: 'guardianConsent',
    with: {dateOfBirth: minorDob, guardianName: 'Ravi', guardianPhone: '9876500000'},
    valid: [true],
    invalid: [
      [false, /guardian consent is required/i],
      [undefined, /guardian consent is required/i],
    ],
  },
];

describe('every form field: valid values give no error, invalid values give the right message', () => {
  it('the base submission is valid', () => {
    expect(errorsFor({})).toEqual({});
  });

  for (const c of cases) {
    const key = c.key ?? c.field;
    describe(key, () => {
      for (const value of c.valid) {
        it(`accepts ${JSON.stringify(value)?.slice(0, 60)}`, () => {
          const e = errorsFor({...c.with, [c.field]: value} as Partial<SubmissionInput>);
          expect(e[key]).toBeUndefined();
          expect(e).toEqual({});
        });
      }
      for (const [value, message] of c.invalid) {
        it(`rejects ${JSON.stringify(value)?.slice(0, 60)}`, () => {
          const e = errorsFor({...c.with, [c.field]: value} as Partial<SubmissionInput>);
          expect(e[key]).toMatch(message);
        });
      }
    });
  }
});

describe('photos', () => {
  const photo = (kind: 'headshot' | 'gallery' | 'full_length', i = 0, extra = {}) => ({
    kind,
    pathname: `submissions/${draftId}/${kind}-${i}.jpg`,
    contentType: 'image/jpeg',
    size: 1000,
    ...extra,
  });

  it('accepts headshot only, and headshot + 4 best pictures + full-length', () => {
    expect(errorsFor({photos: [photo('headshot')]})).toEqual({});
    expect(
      errorsFor({photos: [photo('headshot'), ...[0, 1, 2, 3].map((i) => photo('gallery', i)), photo('full_length')]}),
    ).toEqual({});
  });

  it('requires a headshot', () => {
    expect(errorsFor({photos: []})['photos.headshot']).toMatch(/headshot is required/i);
    expect(errorsFor({photos: [photo('gallery')]})['photos.headshot']).toMatch(/headshot is required/i);
  });

  it('allows only one headshot and one full-length photo', () => {
    expect(errorsFor({photos: [photo('headshot', 0), photo('headshot', 1)]})['photos.headshot']).toMatch(/up to 1/i);
    expect(
      errorsFor({photos: [photo('headshot'), photo('full_length', 0), photo('full_length', 1)]})['photos.full_length'],
    ).toMatch(/up to 1/i);
  });

  it('allows up to 4 best pictures', () => {
    const five = [0, 1, 2, 3, 4].map((i) => photo('gallery', i));
    expect(errorsFor({photos: [photo('headshot'), ...five]})['photos.gallery']).toMatch(/up to 4/i);
  });

  it('accepts JPG, PNG and WebP; rejects other types and files over 10 MB', () => {
    for (const t of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(errorsFor({photos: [photo('headshot', 0, {contentType: t})]})).toEqual({});
    }
    expect(Object.keys(errorsFor({photos: [photo('headshot', 0, {contentType: 'image/gif'})]})).join()).toMatch(/photos/);
    expect(
      Object.keys(errorsFor({photos: [photo('headshot', 0, {size: 10 * 1024 * 1024 + 1})]})).join(),
    ).toMatch(/photos/);
  });
});

describe('adults do not need guardian fields', () => {
  it('ignores empty guardian fields for an adult', () => {
    expect(errorsFor({guardianName: '', guardianPhone: '', guardianConsent: false})).toEqual({});
  });
});

import {describe, expect, it} from 'vitest';
import {isPathInDraft} from './blob-paths';
import {instagramHandle, normalizeCity, titleCase, whatsappLink} from './text';
import {fieldErrors, submissionSchema, type SubmissionInput} from './validation';

import {ageFromDob, isIsoDate} from './age';

const minorDob = `${new Date().getFullYear() - 16}-01-01`;

const draftId = '3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e';

const valid = (): SubmissionInput => ({
  draftId,
  fullName: 'Priya Raman',
  dateOfBirth: '2000-05-14',
  gender: 'female',
  city: 'Chennai',
  phone: '+91 98765 43210',
  whatsapp: '9876543210',
  email: 'Priya@Example.com',
  instagramHandle: '@priya',
  instagramUrl: 'https://instagram.com/priya',
  photos: [
    {kind: 'headshot', pathname: `submissions/${draftId}/headshot-abc.jpg`, contentType: 'image/jpeg', size: 1000},
  ],
  intro: 'Theatre actor.',
  experience: '',
  portfolioLinks: ['https://youtube.com/watch?v=1'],
  showreelUrls: ['https://youtu.be/reel1', 'https://vimeo.com/2'],
  languages: ['Tamil', 'English'],
  heightCm: 165,
  profession: '',
  availability: '',
  willingToTravel: 'yes',
  consent: true,
  website: '',
});

const errorsOf = (input: SubmissionInput) => {
  const r = submissionSchema.safeParse(input);
  return r.success ? {} : fieldErrors(r.error);
};

describe('submissionSchema', () => {
  it('accepts a complete adult submission', () => {
    const r = submissionSchema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe('priya@example.com');
      expect(r.data.experience).toBeUndefined();
    }
  });

  it('requires consent', () => {
    expect(errorsOf({...valid(), consent: false as true}).consent).toBeDefined();
  });

  it('requires a headshot but not gallery or full-length photos', () => {
    const e = errorsOf({...valid(), photos: []});
    expect(e['photos.headshot']).toMatch(/required/i);
    expect(e['photos.gallery']).toBeUndefined();
    expect(e['photos.full_length']).toBeUndefined();
  });

  it('caps best pictures at 4', () => {
    const extra = Array.from({length: 5}, (_, i) => ({
      kind: 'gallery' as const,
      pathname: `submissions/${draftId}/g${i}.jpg`,
      contentType: 'image/jpeg',
      size: 10,
    }));
    expect(errorsOf({...valid(), photos: [...valid().photos, ...extra]})['photos.gallery']).toBeDefined();
  });

  it('requires guardian details for under-18s', () => {
    const e = errorsOf({...valid(), dateOfBirth: minorDob});
    expect(e.guardianName).toBeDefined();
    expect(e.guardianPhone).toBeDefined();
    expect(e.guardianConsent).toBeDefined();
    const ok = errorsOf({...valid(), dateOfBirth: minorDob, guardianName: 'Ravi', guardianPhone: '9876500000', guardianConsent: true});
    expect(ok).toEqual({});
  });

  it('validates email, phone, links and languages', () => {
    const e = errorsOf({
      ...valid(),
      email: 'nope',
      phone: '123',
      portfolioLinks: ['youtube.com/x'],
      languages: [],
      willingToTravel: '' as 'yes',
    });
    expect(e.email).toBeDefined();
    expect(e.phone).toBeDefined();
    expect(e['portfolioLinks.0']).toBeDefined();
    expect(e.languages).toBeDefined();
    expect(e.willingToTravel).toBeDefined();
  });

  it('rejects a filled honeypot', () => {
    expect(errorsOf({...valid(), website: 'http://spam'}).website).toBeDefined();
  });

  it('rejects unsupported image types', () => {
    const photos = [{...valid().photos[0], contentType: 'image/gif'}];
    expect(Object.keys(errorsOf({...valid(), photos })).some((k) => k.startsWith('photos'))).toBe(true);
  });
});

describe('social links', () => {
  it('accepts matching YouTube, Facebook and other links', () => {
    expect(
      errorsOf({
        ...valid(),
        youtubeUrl: 'https://www.youtube.com/@priya',
        facebookUrl: 'https://m.facebook.com/priya',
        otherSocialLinks: ['https://x.com/priya', 'https://www.imdb.com/name/nm1'],
      }),
    ).toEqual({});
    expect(errorsOf({...valid(), youtubeUrl: 'https://youtu.be/abc'})).toEqual({});
  });

  it('rejects links from the wrong site', () => {
    const e = errorsOf({
      ...valid(),
      instagramUrl: 'https://facebook.com/priya',
      youtubeUrl: 'https://vimeo.com/1',
      facebookUrl: 'https://notfacebook.com/x',
      otherSocialLinks: ['not a link'],
    });
    expect(e.instagramUrl).toBeDefined();
    expect(e.youtubeUrl).toBeDefined();
    expect(e.facebookUrl).toBeDefined();
    expect(e['otherSocialLinks.0']).toBeDefined();
  });
});

describe('date of birth', () => {
  it('rejects missing, impossible and future dates', () => {
    expect(errorsOf({...valid(), dateOfBirth: ''}).dateOfBirth).toMatch(/required/i);
    expect(errorsOf({...valid(), dateOfBirth: '2001-02-30'}).dateOfBirth).toBeDefined();
    expect(errorsOf({...valid(), dateOfBirth: '2999-01-01'}).dateOfBirth).toMatch(/future/i);
  });

  it('calculates age with birthdays', () => {
    expect(ageFromDob('2000-05-14', '2026-05-13')).toBe(25);
    expect(ageFromDob('2000-05-14', '2026-05-14')).toBe(26);
    expect(ageFromDob('2004-02-29', '2026-02-28')).toBe(21);
    expect(ageFromDob('', '2026-01-01')).toBeNull();
    expect(isIsoDate('2026-13-01')).toBe(false);
  });
});

describe('isPathInDraft', () => {
  it('only allows files directly inside the draft folder', () => {
    expect(isPathInDraft(`submissions/${draftId}/headshot-Ab12.jpg`, draftId)).toBe(true);
    expect(isPathInDraft(`submissions/other/headshot.jpg`, draftId)).toBe(false);
    expect(isPathInDraft(`submissions/${draftId}/../x.jpg`, draftId)).toBe(false);
    expect(isPathInDraft(`submissions/${draftId}/a/b.jpg`, draftId)).toBe(false);
  });
});

describe('text helpers', () => {
  it('normalizes cities and handles', () => {
    expect(normalizeCity('  Chennai ')).toBe('chennai');
    expect(titleCase('new  delhi')).toBe('New Delhi');
    expect(instagramHandle('https://www.instagram.com/priya.r/?hl=en')).toBe('priya.r');
    expect(instagramHandle('@priya')).toBe('priya');
    expect(whatsappLink('98765 43210')).toBe('https://wa.me/919876543210');
  });
});

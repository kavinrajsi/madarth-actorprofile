import {describe, expect, it} from 'vitest';
import {isPathInDraft} from './blob-paths';
import {instagramHandle, normalizeCity, titleCase, whatsappLink} from './text';
import {fieldErrors, submissionSchema, type SubmissionInput} from './validation';

const draftId = '3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e';

const valid = (): SubmissionInput => ({
  draftId,
  fullName: 'Priya Raman',
  age: 24,
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
  showreelUrl: '',
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
    const e = errorsOf({...valid(), age: 16});
    expect(e.guardianName).toBeDefined();
    expect(e.guardianPhone).toBeDefined();
    expect(e.guardianConsent).toBeDefined();
    const ok = errorsOf({...valid(), age: 16, guardianName: 'Ravi', guardianPhone: '9876500000', guardianConsent: true});
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

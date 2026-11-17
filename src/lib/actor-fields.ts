import 'server-only';
import {head} from '@vercel/blob';
import {ageFromDob} from './age';
import {isPathInDraft} from './blob-paths';
import {clean, instagramHandle, normalizeCity, normalizePhone, titleCase} from './text';
import type {PhotoInput, Submission} from './validation';

/** Editable profile columns derived from a validated submission (shared by create and edit). */
export function profileFields(v: Submission) {
  const handle = v.instagramHandle ? instagramHandle(v.instagramHandle) : undefined;
  const isMinor = (ageFromDob(v.dateOfBirth) ?? 99) < 18;
  return {
    fullName: clean(v.fullName),
    dateOfBirth: v.dateOfBirth,
    gender: v.gender,
    city: titleCase(v.city),
    cityNormalized: normalizeCity(v.city),
    phone: normalizePhone(v.phone),
    whatsapp: normalizePhone(v.whatsapp),
    guardianName: isMinor ? (v.guardianName ?? null) : null,
    guardianPhone: isMinor && v.guardianPhone ? normalizePhone(v.guardianPhone) : null,
    guardianConsent: isMinor ? true : null,
    instagramHandle: handle ?? null,
    instagramUrl: v.instagramUrl ?? (handle ? `https://instagram.com/${handle}` : null),
    youtubeUrl: v.youtubeUrl ?? null,
    facebookUrl: v.facebookUrl ?? null,
    otherSocialLinks: v.otherSocialLinks,
    intro: v.intro,
    experience: v.experience ?? null,
    portfolioLinks: v.portfolioLinks,
    showreelUrls: v.showreelUrls,
    languages: [...new Set(v.languages.map(titleCase))],
    heightCm: v.heightCm ?? null,
    profession: v.profession ?? null,
    availability: v.availability ?? null,
    willingToTravel: v.willingToTravel === 'yes',
  };
}

export const PHOTO_ORDER = {headshot: 0, full_length: 1, gallery: 2} as const;

/** Checks that a newly uploaded photo is a real blob inside this draft's folder. Returns an error message or null. */
export async function checkNewPhoto(p: PhotoInput, draftId: string): Promise<string | null> {
  if (!isPathInDraft(p.pathname, draftId)) return 'One of the photos is invalid. Please upload it again.';
  try {
    const meta = await head(p.pathname);
    if (meta.pathname !== p.pathname || meta.size !== p.size) return 'One of the photos is invalid. Please upload it again.';
  } catch {
    return 'One of the photos could not be found. Please upload it again.';
  }
  return null;
}

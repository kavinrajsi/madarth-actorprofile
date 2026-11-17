'use server';

import {randomUUID} from 'node:crypto';
import {head} from '@vercel/blob';
import {eq, or, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {isPathInDraft} from '@/lib/blob-paths';
import {CONSENT_VERSION} from '@/lib/constants';
import {rateLimit} from '@/lib/rate-limit';
import {clean, instagramHandle, normalizeCity, normalizePhone, titleCase} from '@/lib/text';
import {fieldErrors, submissionSchema, type SubmissionInput} from '@/lib/validation';

export type SubmitResult =
  | {ok: true; code: string}
  | {ok: false; message: string; fieldErrors?: Record<string, string>};

export async function submitProfile(input: SubmissionInput): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return {ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error)};
  }
  const v = parsed.data;

  if (!(await rateLimit('submit', 5, 3600))) {
    return {ok: false, message: 'Too many submissions from this network. Please try again in an hour.'};
  }

  // Every photo must be a real private blob uploaded into this draft's folder.
  for (const p of v.photos) {
    if (!isPathInDraft(p.pathname, v.draftId)) {
      return {ok: false, message: 'One of the photos is invalid. Please upload it again.'};
    }
    try {
      const meta = await head(p.pathname);
      if (meta.pathname !== p.pathname || meta.size !== p.size) {
        return {ok: false, message: 'One of the photos is invalid. Please upload it again.'};
      }
    } catch {
      return {ok: false, message: 'One of the photos could not be found. Please upload it again.'};
    }
  }

  const db = getDb();
  const phone = normalizePhone(v.phone);
  const whatsapp = normalizePhone(v.whatsapp);

  const existing = await db
    .select({id: schema.actors.id})
    .from(schema.actors)
    .where(or(sql`lower(${schema.actors.email}) = ${v.email}`, eq(schema.actors.phone, phone)))
    .limit(1);

  const handle = v.instagramHandle ? instagramHandle(v.instagramHandle) : undefined;
  const isMinor = v.age < 18;
  const actorId = randomUUID();
  const languages = [...new Set(v.languages.map(titleCase))];

  const insertActor = db
    .insert(schema.actors)
    .values({
      id: actorId,
      fullName: clean(v.fullName),
      age: v.age,
      gender: v.gender,
      city: titleCase(v.city),
      cityNormalized: normalizeCity(v.city),
      phone,
      whatsapp,
      email: v.email,
      guardianName: isMinor ? v.guardianName : null,
      guardianPhone: isMinor && v.guardianPhone ? normalizePhone(v.guardianPhone) : null,
      guardianConsent: isMinor ? true : null,
      instagramHandle: handle ?? null,
      instagramUrl: v.instagramUrl ?? (handle ? `https://instagram.com/${handle}` : null),
      intro: v.intro,
      experience: v.experience ?? null,
      portfolioLinks: v.portfolioLinks,
      showreelUrl: v.showreelUrl ?? null,
      languages,
      heightCm: v.heightCm ?? null,
      profession: v.profession ?? null,
      availability: v.availability ?? null,
      willingToTravel: v.willingToTravel === 'yes',
      consent: true,
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      possibleDuplicate: existing.length > 0,
    })
    .returning({code: schema.actors.actorCode});

  const order = {headshot: 0, full_length: 1, gallery: 2} as const;
  const photos = [...v.photos]
    .sort((a, b) => order[a.kind] - order[b.kind])
    .map((p, i) => ({
      actorId,
      kind: p.kind,
      blobPathname: p.pathname,
      contentType: p.contentType,
      sizeBytes: p.size,
      sort: i,
    }));

  try {
    // neon-http has no interactive transactions; batch() runs both statements atomically.
    const [inserted] = photos.length
      ? await db.batch([insertActor, db.insert(schema.actorPhotos).values(photos)])
      : [await insertActor];
    const code = inserted[0]?.code;
    if (!code) throw new Error('No actor code returned');
    return {ok: true, code};
  } catch (err) {
    console.error('submitProfile failed', err);
    return {ok: false, message: 'Something went wrong while saving your profile. Please try again.'};
  }
}

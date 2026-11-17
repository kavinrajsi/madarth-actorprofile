'use server';

import {randomUUID} from 'node:crypto';
import {after} from 'next/server';
import {eq, or, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {sendRegistrationEmails} from '@/lib/account/service';
import {checkNewPhoto, PHOTO_ORDER, profileFields} from '@/lib/actor-fields';
import {CONSENT_VERSION} from '@/lib/constants';
import {safeError} from '@/lib/log';
import {rateLimit} from '@/lib/rate-limit';
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

  if (!(await rateLimit('submit', 20, 3600))) {
    return {ok: false, message: 'Too many submissions from this network. Please try again in an hour.'};
  }

  // Every photo must be a real private blob uploaded into this draft's folder.
  for (const p of v.photos) {
    const problem = await checkNewPhoto(p, v.draftId);
    if (problem) return {ok: false, message: problem};
  }

  const db = getDb();
  const fields = profileFields(v);
  const existing = await db
    .select({id: schema.actors.id})
    .from(schema.actors)
    .where(or(sql`lower(${schema.actors.email}) = ${v.email}`, eq(schema.actors.phone, fields.phone)))
    .limit(1);

  const actorId = randomUUID();
  const insertActor = db
    .insert(schema.actors)
    .values({
      id: actorId,
      ...fields,
      email: v.email,
      consent: true,
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      possibleDuplicate: existing.length > 0,
    })
    .returning({code: schema.actors.actorCode});

  const photos = [...v.photos]
    .sort((a, b) => PHOTO_ORDER[a.kind] - PHOTO_ORDER[b.kind])
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
    // 1) thank-you email, 2) account invitation, sent after the response is returned.
    after(() => sendRegistrationEmails(actorId));
    return {ok: true, code};
  } catch (err) {
    console.error('submitProfile failed:', safeError(err));
    return {ok: false, message: 'Something went wrong while saving your profile. Please try again.'};
  }
}

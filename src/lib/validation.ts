import {z} from 'zod';
import {genderEnum, photoKindEnum} from '@/db/schema-enums';
import {PHOTO_ACCEPT, PHOTO_MAX_BYTES, PHOTO_RULES} from './constants';

const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be under ${max} characters`);

const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `Must be under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const phone = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^\+?[\d\s().-]+$/.test(v), `Enter a valid ${label.toLowerCase()}`)
    .refine((v) => {
      const d = v.replace(/\D/g, '').length;
      return d >= 10 && d <= 15;
    }, `Enter a valid ${label.toLowerCase()} (10–15 digits)`);

const url = z
  .string()
  .trim()
  .url('Enter a full link starting with https://')
  .refine((v) => /^https?:\/\//i.test(v), 'Enter a full link starting with https://');

const optionalUrl = z
  .union([z.literal(''), url])
  .optional()
  .transform((v) => (v ? v : undefined));

export const photoSchema = z.object({
  kind: z.enum(photoKindEnum),
  pathname: z.string().min(1).max(500),
  contentType: z.string().refine((v) => PHOTO_ACCEPT.includes(v), 'Unsupported image type'),
  size: z.number().int().positive().max(PHOTO_MAX_BYTES),
});

export type PhotoInput = z.infer<typeof photoSchema>;

export const submissionSchema = z
  .object({
    draftId: z.uuid(),
    // 1. Basic
    fullName: requiredText('Full name', 120),
    age: z.coerce
      .number({error: 'Age is required'})
      .int('Age must be a whole number')
      .min(1, 'Age is required')
      .max(100, 'Enter a valid age'),
    gender: z.enum(genderEnum, {error: 'Select a gender'}),
    city: requiredText('City', 80),
    phone: phone('Contact number'),
    whatsapp: phone('WhatsApp number'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
    guardianName: optionalText(120),
    guardianPhone: z.string().trim().optional(),
    guardianConsent: z.boolean().optional(),
    // 2. Social
    instagramHandle: optionalText(60),
    instagramUrl: optionalUrl,
    // 3. Photos
    photos: z
      .array(photoSchema)
      .max(6)
      .superRefine((photos, ctx) => {
        // Field-level so it reports even when other fields are still invalid.
        for (const [kind, rule] of Object.entries(PHOTO_RULES)) {
          const n = photos.filter((p) => p.kind === kind).length;
          if (n < rule.min) {
            ctx.addIssue({
              code: 'custom',
              path: [kind],
              message: rule.min === 1 ? `${rule.label} is required` : `Add at least ${rule.min}`,
            });
          }
          if (n > rule.max) ctx.addIssue({code: 'custom', path: [kind], message: `Up to ${rule.max} allowed`});
        }
      }),
    // 4. Experience
    intro: requiredText('Introduction', 1500),
    experience: optionalText(4000),
    portfolioLinks: z.array(url).max(10, 'Add up to 10 links'),
    showreelUrl: optionalUrl,
    // 5. Additional
    languages: z
      .array(z.string().trim().min(1).max(40))
      .min(1, 'Select at least one language')
      .max(15),
    heightCm: z
      .union([z.literal(''), z.coerce.number().int().min(50, 'Enter height in cm').max(250, 'Enter height in cm')])
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : v)),
    profession: optionalText(120),
    availability: optionalText(300),
    willingToTravel: z.enum(['yes', 'no'], {error: 'Choose Yes or No'}),
    // Consent
    consent: z.literal(true, {error: 'You must give consent to submit your profile'}),
    // Honeypot: must stay empty
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.age < 18) {
      if (!v.guardianName) {
        ctx.addIssue({code: 'custom', path: ['guardianName'], message: 'Parent/guardian name is required for under-18s'});
      }
      const gp = phone('Guardian phone').safeParse(v.guardianPhone ?? '');
      if (!gp.success) {
        ctx.addIssue({code: 'custom', path: ['guardianPhone'], message: gp.error.issues[0]?.message ?? 'Enter a valid phone'});
      }
      if (v.guardianConsent !== true) {
        ctx.addIssue({code: 'custom', path: ['guardianConsent'], message: 'Parent/guardian consent is required for under-18s'});
      }
    }
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type Submission = z.output<typeof submissionSchema>;

/** Flatten zod issues into { "fieldPath": "message" } (first message wins). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    out[key] ??= issue.message;
  }
  return out;
}

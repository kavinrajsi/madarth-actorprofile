import {sql} from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import * as E from './schema-enums';

export const genderEnum = pgEnum('gender', E.genderEnum);

export const statusEnum = pgEnum('actor_status', E.statusEnum);

export const photoKindEnum = pgEnum('photo_kind', E.photoKindEnum);

export const actorCodeSeq = pgSequence('actor_code_seq', {startWith: 1, increment: 1});

export const actors = pgTable(
  'actors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Human-friendly registration ID, e.g. MAD-26-00042. */
    actorCode: text('actor_code')
      .notNull()
      .unique()
      .default(
        sql`('MAD-' || to_char(now(), 'YY') || '-' || lpad(nextval('actor_code_seq')::text, 5, '0'))`,
      ),

    // Basic details
    fullName: text('full_name').notNull(),
    age: integer('age').notNull(),
    gender: genderEnum('gender').notNull(),
    city: text('city').notNull(),
    cityNormalized: text('city_normalized').notNull(),
    phone: text('phone').notNull(),
    whatsapp: text('whatsapp').notNull(),
    email: text('email').notNull(),

    // Guardian (minors only)
    guardianName: text('guardian_name'),
    guardianPhone: text('guardian_phone'),
    guardianConsent: boolean('guardian_consent'),

    // Social
    instagramHandle: text('instagram_handle'),
    instagramUrl: text('instagram_url'),

    // Acting experience
    intro: text('intro').notNull(),
    experience: text('experience'),
    portfolioLinks: text('portfolio_links').array().notNull().default(sql`'{}'::text[]`),
    showreelUrl: text('showreel_url'),

    // Additional
    languages: text('languages').array().notNull().default(sql`'{}'::text[]`),
    heightCm: integer('height_cm'),
    profession: text('profession'),
    availability: text('availability'),
    willingToTravel: boolean('willing_to_travel').notNull(),

    // Consent
    consent: boolean('consent').notNull(),
    consentAt: timestamp('consent_at', {withTimezone: true}).notNull(),
    consentVersion: text('consent_version').notNull(),

    // Casting workflow
    status: statusEnum('status').notNull().default('new'),
    notes: text('notes'),
    possibleDuplicate: boolean('possible_duplicate').notNull().default(false),

    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [
    index('actors_status_idx').on(t.status),
    index('actors_gender_idx').on(t.gender),
    index('actors_age_idx').on(t.age),
    index('actors_city_idx').on(t.cityNormalized),
    index('actors_languages_idx').using('gin', t.languages),
    index('actors_created_idx').on(t.createdAt.desc()),
    index('actors_email_idx').on(sql`lower(${t.email})`),
    index('actors_phone_idx').on(t.phone),
  ],
);

export const actorPhotos = pgTable(
  'actor_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => actors.id, {onDelete: 'cascade'}),
    kind: photoKindEnum('kind').notNull(),
    blobPathname: text('blob_pathname').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sort: integer('sort').notNull().default(0),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [index('actor_photos_actor_idx').on(t.actorId)],
);

export const statusEvents = pgTable(
  'status_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => actors.id, {onDelete: 'cascade'}),
    fromStatus: statusEnum('from_status'),
    toStatus: statusEnum('to_status').notNull(),
    byEmail: text('by_email').notNull(),
    at: timestamp('at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [index('status_events_actor_idx').on(t.actorId, t.at)],
);

export const teamMembers = pgTable('team_members', {
  /** Always stored lowercased. */
  email: text('email').primaryKey(),
  addedBy: text('added_by').notNull(),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
});

/** Simple sliding-window rate limiting for the public endpoints. */
export const rateEvents = pgTable(
  'rate_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    at: timestamp('at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [index('rate_events_key_at_idx').on(t.key, t.at)],
);

export type Actor = typeof actors.$inferSelect;
export type ActorPhoto = typeof actorPhotos.$inferSelect;
export type ActorStatus = (typeof E.statusEnum)[number];
export type Gender = (typeof E.genderEnum)[number];
export type PhotoKind = (typeof E.photoKindEnum)[number];

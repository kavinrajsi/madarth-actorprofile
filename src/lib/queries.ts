import 'server-only';
import {and, arrayOverlaps, asc, count, desc, eq, gte, ilike, lt, or, sql, type SQL} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {genderEnum, statusEnum} from '@/db/schema-enums';
import type {ActorStatus, Gender} from '@/db/schema';
import {ADMIN_PAGE_SIZE} from './constants';

const {actors, actorPhotos, statusEvents} = schema;

export type Filters = {
  q?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: Gender;
  city?: string;
  languages: string[];
  status?: ActorStatus;
  from?: string;
  to?: string;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const int = (v: string | undefined) => {
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const isoDate = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export function parseFilters(p: Params): Filters {
  const gender = one(p.gender);
  const status = one(p.status);
  const langs = p.lang ? (Array.isArray(p.lang) ? p.lang : p.lang.split(',')) : [];
  return {
    q: one(p.q)?.slice(0, 100),
    ageMin: int(one(p.ageMin)),
    ageMax: int(one(p.ageMax)),
    gender: (genderEnum as readonly string[]).includes(gender ?? '') ? (gender as Gender) : undefined,
    city: one(p.city)?.toLowerCase(),
    languages: langs.map((l) => l.trim()).filter(Boolean).slice(0, 15),
    status: (statusEnum as readonly string[]).includes(status ?? '') ? (status as ActorStatus) : undefined,
    from: isoDate(one(p.from)),
    to: isoDate(one(p.to)),
    page: Math.max(1, int(one(p.page)) ?? 1),
  };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);

function whereFor(f: Filters): SQL | undefined {
  const c: (SQL | undefined)[] = [];
  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    const digits = f.q.replace(/\D/g, '');
    c.push(
      or(
        ilike(actors.fullName, like),
        ilike(actors.actorCode, like),
        ilike(actors.email, like),
        ilike(actors.instagramHandle, like),
        digits.length >= 4 ? ilike(actors.phone, `%${digits}%`) : undefined,
        digits.length >= 4 ? ilike(actors.whatsapp, `%${digits}%`) : undefined,
      ),
    );
  }
  // Age is derived from date of birth, so filters stay correct as time passes.
  if (f.ageMin !== undefined) {
    c.push(sql`${actors.dateOfBirth} <= (current_date - make_interval(years => ${f.ageMin}))`);
  }
  if (f.ageMax !== undefined) {
    c.push(sql`${actors.dateOfBirth} > (current_date - make_interval(years => ${f.ageMax + 1}))`);
  }
  if (f.gender) c.push(eq(actors.gender, f.gender));
  if (f.city) c.push(eq(actors.cityNormalized, f.city));
  if (f.languages.length) c.push(arrayOverlaps(actors.languages, f.languages));
  if (f.status) c.push(eq(actors.status, f.status));
  if (f.from) c.push(gte(actors.createdAt, new Date(`${f.from}T00:00:00+05:30`)));
  if (f.to) {
    const end = new Date(`${f.to}T00:00:00+05:30`);
    end.setUTCDate(end.getUTCDate() + 1);
    c.push(lt(actors.createdAt, end));
  }
  const parts = c.filter((x): x is SQL => Boolean(x));
  return parts.length ? and(...parts) : undefined;
}

const headshotId = sql<string | null>`(
  select ${actorPhotos.id} from ${actorPhotos}
  where ${actorPhotos.actorId} = ${actors.id} and ${actorPhotos.kind} = 'headshot'
  order by ${actorPhotos.sort} limit 1
)`;

export async function listActors(f: Filters) {
  const db = getDb();
  const where = whereFor(f);
  const [rows, [{total}]] = await Promise.all([
    db
      .select({
        id: actors.id,
        code: actors.actorCode,
        fullName: actors.fullName,
        age: sql<number>`extract(year from age(current_date, ${actors.dateOfBirth}))::int`,
        dateOfBirth: actors.dateOfBirth,
        gender: actors.gender,
        city: actors.city,
        languages: actors.languages,
        phone: actors.phone,
        whatsapp: actors.whatsapp,
        email: actors.email,
        status: actors.status,
        possibleDuplicate: actors.possibleDuplicate,
        createdAt: actors.createdAt,
        headshotId,
      })
      .from(actors)
      .where(where)
      .orderBy(desc(actors.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((f.page - 1) * ADMIN_PAGE_SIZE),
    db.select({total: count()}).from(actors).where(where),
  ]);
  return {rows, total};
}

export type ActorRow = Awaited<ReturnType<typeof listActors>>['rows'][number];

export async function filterOptions() {
  const db = getDb();
  const [cities, langs] = await Promise.all([
    db
      .select({value: actors.cityNormalized, label: sql<string>`min(${actors.city})`, n: count()})
      .from(actors)
      .groupBy(actors.cityNormalized)
      .orderBy(desc(count()))
      .limit(300),
    db.execute<{lang: string}>(
      sql`select distinct unnest(${actors.languages}) as lang from ${actors} order by 1 limit 200`,
    ),
  ]);
  return {
    cities: cities.map((c) => ({value: c.value, label: c.label})),
    languages: langs.rows.map((r) => r.lang),
  };
}

export async function statusCounts() {
  const rows = await getDb()
    .select({status: actors.status, n: count()})
    .from(actors)
    .groupBy(actors.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<ActorStatus, number>>;
}

export async function getActorByCode(code: string) {
  const db = getDb();
  const [actor] = await db.select().from(actors).where(eq(actors.actorCode, code)).limit(1);
  if (!actor) return null;
  const [photos, history] = await Promise.all([
    db
      .select({id: actorPhotos.id, kind: actorPhotos.kind})
      .from(actorPhotos)
      .where(eq(actorPhotos.actorId, actor.id))
      .orderBy(asc(actorPhotos.sort)),
    db
      .select()
      .from(statusEvents)
      .where(eq(statusEvents.actorId, actor.id))
      .orderBy(desc(statusEvents.at))
      .limit(50),
  ]);
  return {actor, photos, history};
}

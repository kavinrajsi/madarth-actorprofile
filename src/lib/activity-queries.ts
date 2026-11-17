import 'server-only';
import {and, count, desc, eq, gte, inArray, lt, ne, or, type SQL} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import type {ActivityEntry} from '@/db/schema';
import {ACTIVITY_ACTIONS, ACTOR_VISIBLE_ADMIN_ACTIONS} from './activity-actions';

const {activityLog: L} = schema;

/** What list components receive (dates as ISO strings, raw UA dropped). */
export type ActivityRow = Omit<ActivityEntry, 'at' | 'userAgent'> & {at: string};

function toRow(entry: ActivityEntry): ActivityRow {
  // The raw user agent stays in the database; lists only need the parsed device.
  const {userAgent, ...e} = entry;
  void userAgent;
  return {...e, at: e.at.toISOString()};
}

async function page(where: SQL | undefined, pageNo: number, size: number) {
  const db = getDb();
  const [rows, [{n}]] = await Promise.all([
    db
      .select()
      .from(L)
      .where(where)
      .orderBy(desc(L.at))
      .limit(size)
      .offset((Math.max(1, pageNo) - 1) * size),
    db.select({n: count()}).from(L).where(where),
  ]);
  return {rows: rows.map(toRow), total: n};
}

/** An actor's own log: their account's entries plus visible casting-team actions on their profiles. */
export function actorActivity(accountId: string, actorIds: string[], pageNo = 1, size = 25) {
  const own = eq(L.accountId, accountId);
  const aboutMe = actorIds.length
    ? and(
        inArray(L.subjectActorId, actorIds),
        or(ne(L.actorType, 'admin'), inArray(L.action, [...ACTOR_VISIBLE_ADMIN_ACTIONS])),
      )
    : undefined;
  return page(aboutMe ? or(own, aboutMe) : own, pageNo, size);
}

/** Admin view of one profile: everything about it plus its account's sign-ins and security changes. */
export function profileActivity(actorId: string, accountId: string | null, pageNo = 1, size = 20) {
  const about = eq(L.subjectActorId, actorId);
  return page(accountId ? or(about, eq(L.accountId, accountId)) : about, pageNo, size);
}

export type ActivityFilters = {
  who?: 'admin' | 'actor';
  admin?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
};

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function parseActivityFilters(p: Record<string, string | string[] | undefined>): ActivityFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  const who = one(p.who);
  const action = one(p.action);
  return {
    who: who === 'admin' || who === 'actor' ? who : undefined,
    admin: one(p.admin)?.toLowerCase().slice(0, 200),
    action: action && action in ACTIVITY_ACTIONS ? action : undefined,
    from: isDate(one(p.from)) ? one(p.from) : undefined,
    to: isDate(one(p.to)) ? one(p.to) : undefined,
    page: Math.max(1, Number.parseInt(one(p.page) ?? '1', 10) || 1),
  };
}

/** The whole log for the admin Activity page. Dates are IST calendar days. */
export function allActivity(f: ActivityFilters, size = 50) {
  const c: SQL[] = [];
  if (f.who === 'admin') c.push(eq(L.actorType, 'admin'));
  if (f.who === 'actor') c.push(ne(L.actorType, 'admin'));
  if (f.admin) c.push(eq(L.adminEmail, f.admin));
  if (f.action) c.push(eq(L.action, f.action));
  if (f.from) c.push(gte(L.at, new Date(`${f.from}T00:00:00+05:30`)));
  if (f.to) {
    const end = new Date(`${f.to}T00:00:00+05:30`);
    end.setUTCDate(end.getUTCDate() + 1);
    c.push(lt(L.at, end));
  }
  return page(c.length ? and(...c) : undefined, f.page, size);
}

/** Admin emails that appear in the log (for the filter). */
export async function loggedAdmins(): Promise<string[]> {
  const rows = await getDb().selectDistinct({email: L.adminEmail}).from(L).where(eq(L.actorType, 'admin'));
  return rows.map((r) => r.email).filter((e): e is string => Boolean(e)).sort();
}

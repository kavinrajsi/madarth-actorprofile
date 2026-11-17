import 'server-only';
import {headers} from 'next/headers';
import {after} from 'next/server';
import {and, eq, gt} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {formatLocation, parseDevice, type ActivityAction} from './activity-actions';
import {safeError} from './log';
import {clientIp} from './rate-limit';

export type ActivityInput = {
  actorType: 'actor' | 'admin' | 'system';
  action: ActivityAction;
  accountId?: string | null;
  adminEmail?: string | null;
  subjectActorId?: string | null;
  subjectCode?: string | null;
  /** Safe metadata only: never codes, passwords, notes text or profile values. */
  details?: Record<string, unknown>;
  /** System entries (e.g. profile deleted) don't store who/where. */
  withoutRequestInfo?: boolean;
};

async function requestContext() {
  try {
    const h = await headers();
    const ip = await clientIp();
    const ua = h.get('user-agent');
    return {
      ip: ip === 'unknown' ? null : ip,
      userAgent: ua ? ua.slice(0, 400) : null,
      device: parseDevice(ua),
      location: formatLocation(h.get('x-vercel-ip-city'), h.get('x-vercel-ip-country-region'), h.get('x-vercel-ip-country')),
    };
  } catch {
    return {ip: null, userAgent: null, device: null, location: null};
  }
}

/**
 * Records an activity entry. Request details are captured now; the insert runs after the
 * response, so logging never slows down or breaks the user's request.
 * Call from server actions, route handlers or server components.
 */
export async function logActivity(input: ActivityInput) {
  const ctx = input.withoutRequestInfo ? {ip: null, userAgent: null, device: null, location: null} : await requestContext();
  const row = {
    actorType: input.actorType,
    action: input.action,
    accountId: input.accountId ?? null,
    adminEmail: input.adminEmail ?? null,
    subjectActorId: input.subjectActorId ?? null,
    subjectCode: input.subjectCode ?? null,
    details: input.details ?? null,
    ...ctx,
  };
  after(async () => {
    try {
      await getDb().insert(schema.activityLog).values(row);
    } catch (err) {
      console.error('[activity] insert failed:', safeError(err));
    }
  });
}

/** True if this admin already viewed this profile in the last 30 minutes (keeps the log readable). */
export async function recentlyViewed(adminEmail: string, actorId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({id: schema.activityLog.id})
    .from(schema.activityLog)
    .where(
      and(
        eq(schema.activityLog.adminEmail, adminEmail),
        eq(schema.activityLog.subjectActorId, actorId),
        eq(schema.activityLog.action, 'profile_viewed'),
        gt(schema.activityLog.at, new Date(Date.now() - 30 * 60 * 1000)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

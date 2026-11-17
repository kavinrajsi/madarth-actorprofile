import 'server-only';
import {createHash} from 'node:crypto';
import {headers} from 'next/headers';
import {and, eq, gt, lt, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';

/** Client IP as Vercel reports it ('unknown' when absent). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function clientIpKey(): Promise<string> {
  const ip = await clientIp();
  // Hash so raw IPs are never stored.
  return createHash('sha256')
    .update(ip + (process.env.AUTH_SECRET ?? ''))
    .digest('hex')
    .slice(0, 32);
}

/**
 * Sliding-window limiter backed by Postgres. Returns false when over the limit.
 * Good enough for a low-traffic public form; add a Vercel Firewall rate-limit rule for bursts.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  return rateLimitKey(`${bucket}:${await clientIpKey()}`, limit, windowSeconds);
}

/** True while `key` has fewer than `limit` hits in the window. Does not record a hit. */
export async function underLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000);
  const [{count}] = await getDb()
    .select({count: sql<number>`count(*)::int`})
    .from(schema.rateEvents)
    .where(and(eq(schema.rateEvents.key, key), gt(schema.rateEvents.at, since)));
  return count < limit;
}

/** Records one hit for `key` (e.g. a wrong two-factor code). */
export async function recordHit(key: string) {
  await getDb().insert(schema.rateEvents).values({key});
}

/** Same limiter with an explicit key, e.g. per account, regardless of IP. Every call counts. */
export async function rateLimitKey(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - windowSeconds * 1000);
  const [{count}] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(schema.rateEvents)
    .where(and(eq(schema.rateEvents.key, key), gt(schema.rateEvents.at, since)));
  if (count >= limit) return false;
  await db.insert(schema.rateEvents).values({key});
  // Opportunistic cleanup of old rows (cheap with the key/at index).
  if (Math.random() < 0.05) {
    await db
      .delete(schema.rateEvents)
      .where(lt(schema.rateEvents.at, new Date(Date.now() - 2 * 24 * 3600 * 1000)));
  }
  return true;
}

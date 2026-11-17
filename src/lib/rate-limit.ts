import 'server-only';
import {createHash} from 'node:crypto';
import {headers} from 'next/headers';
import {and, eq, gt, lt, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';

export async function clientIpKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
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
  const db = getDb();
  const key = `${bucket}:${await clientIpKey()}`;
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

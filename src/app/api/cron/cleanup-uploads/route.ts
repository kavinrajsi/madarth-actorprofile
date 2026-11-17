import {timingSafeEqual} from 'node:crypto';
import {del, list} from '@vercel/blob';
import {lt, sql} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {safeError} from '@/lib/log';

/** Draft folders untouched for longer than this, and not linked to any profile, are deleted. */
const MAX_AGE_MS = 24 * 3600 * 1000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get('authorization') ?? '';
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily (Vercel Cron): remove photo uploads from registration/edit forms that were never saved,
 * and prune old rate-limit rows.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return new Response('Unauthorized', {status: 401});

  const db = getDb();
  try {
    // Draft folders still used by a profile photo.
    const linkedRows = await db
      .selectDistinct({draft: sql<string>`split_part(${schema.actorPhotos.blobPathname}, '/', 2)`})
      .from(schema.actorPhotos);
    const linked = new Set(linkedRows.map((r) => r.draft));

    // Every uploaded blob, grouped by draft folder (newest upload time per folder).
    const folders = new Map<string, {urls: string[]; newest: number}>();
    let cursor: string | undefined;
    do {
      const page = await list({prefix: 'submissions/', cursor, limit: 1000});
      for (const b of page.blobs) {
        const draft = b.pathname.split('/')[1];
        if (!draft) continue;
        const f = folders.get(draft) ?? {urls: [], newest: 0};
        f.urls.push(b.url);
        f.newest = Math.max(f.newest, b.uploadedAt.getTime());
        folders.set(draft, f);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const cutoff = Date.now() - MAX_AGE_MS;
    const stale = [...folders.entries()].filter(([draft, f]) => !linked.has(draft) && f.newest < cutoff);
    const urls = stale.flatMap(([, f]) => f.urls);
    for (let i = 0; i < urls.length; i += 500) await del(urls.slice(i, i + 500));

    const pruned = await db
      .delete(schema.rateEvents)
      .where(lt(schema.rateEvents.at, new Date(Date.now() - 2 * 24 * 3600 * 1000)))
      .returning({id: schema.rateEvents.id});

    const result = {draftFolders: folders.size, deletedFolders: stale.length, deletedFiles: urls.length, prunedRateRows: pruned.length};
    console.log('[cron] cleanup-uploads', JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    console.error('[cron] cleanup-uploads failed:', safeError(err));
    return new Response('Cleanup failed', {status: 500});
  }
}

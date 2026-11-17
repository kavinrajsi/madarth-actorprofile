// Applies pending Drizzle migrations (./drizzle) before `next build`.
// On Vercel the Neon connection string is available at build time even though it is Sensitive.
// Skips with a message when no database is configured (e.g. a local build without DATABASE_URL).
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import {migrate} from 'drizzle-orm/neon-http/migrator';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url || !/^postgres(ql)?:\/\//.test(url)) {
  console.log('[migrate] No DATABASE_URL set; skipping database migrations.');
  process.exit(0);
}

const started = Date.now();
try {
  await migrate(drizzle({client: neon(url)}), {migrationsFolder: './drizzle'});
  console.log(`[migrate] Database is up to date (${Date.now() - started} ms).`);
} catch (err) {
  console.error('[migrate] Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}

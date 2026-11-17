import {cache} from 'react';
import {eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';

export type Role = 'super_admin' | 'member';

/** Super admins come only from the SUPER_ADMIN_EMAILS env var (comma-separated). */
export function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Resolve an email's role from the source of truth (env + team_members table).
 * Called on every admin request so removing a member takes effect immediately.
 */
export const resolveRole = cache(async (rawEmail: string | null | undefined): Promise<Role | null> => {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return null;
  if (superAdminEmails().includes(email)) return 'super_admin';
  const rows = await getDb()
    .select({email: schema.teamMembers.email})
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.email, email))
    .limit(1);
  return rows.length > 0 ? 'member' : null;
});

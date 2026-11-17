import 'server-only';
import {redirect} from 'next/navigation';
import {connection} from 'next/server';
import {auth} from '@/auth';
import {resolveRole, type Role} from './roles';

export type Admin = {email: string; name: string | null; role: Role};

/** Current admin, re-verified against env + DB. Null when not signed in or no longer allowed. */
export async function getAdmin(): Promise<Admin | null> {
  // Auth.js touches crypto before cookies; mark this as request-time work for Cache Components.
  await connection();
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const role = await resolveRole(email);
  if (!role) return null;
  return {email, name: session?.user?.name ?? null, role};
}

/** For pages and server actions: redirect to /login when not allowed. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/login?error=AccessDenied');
  return admin;
}

export async function requireSuperAdmin(): Promise<Admin> {
  const admin = await requireAdmin();
  if (admin.role !== 'super_admin') redirect('/admin');
  return admin;
}

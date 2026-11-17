'use server';

import {revalidatePath} from 'next/cache';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
import {signOut} from '@/auth';
import {getDb, schema} from '@/db';
import {statusEnum} from '@/db/schema-enums';
import {requireAdmin, requireSuperAdmin} from '@/lib/authz';
import {superAdminEmails} from '@/lib/roles';
import {ensureAccount, sendSetupInvite} from '@/lib/account/service';

type Result = {ok: true} | {ok: false; message: string};

export async function updateStatus(actorId: string, status: string): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z.object({actorId: z.uuid(), status: z.enum(statusEnum)}).safeParse({actorId, status});
  if (!parsed.success) return {ok: false, message: 'Invalid status'};

  const db = getDb();
  const [current] = await db
    .select({status: schema.actors.status, code: schema.actors.actorCode})
    .from(schema.actors)
    .where(eq(schema.actors.id, actorId))
    .limit(1);
  if (!current) return {ok: false, message: 'Actor not found'};
  if (current.status === parsed.data.status) return {ok: true};

  await db.batch([
    db
      .update(schema.actors)
      .set({status: parsed.data.status, updatedAt: new Date()})
      .where(eq(schema.actors.id, actorId)),
    db.insert(schema.statusEvents).values({
      actorId,
      fromStatus: current.status,
      toStatus: parsed.data.status,
      byEmail: admin.email,
    }),
  ]);
  revalidatePath('/admin');
  revalidatePath(`/admin/actors/${current.code}`);
  return {ok: true};
}

export async function saveNotes(actorId: string, notes: string): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({actorId: z.uuid(), notes: z.string().max(5000)}).safeParse({actorId, notes});
  if (!parsed.success) return {ok: false, message: 'Notes must be under 5000 characters'};
  await getDb()
    .update(schema.actors)
    .set({notes: parsed.data.notes.trim() || null, updatedAt: new Date()})
    .where(eq(schema.actors.id, actorId));
  return {ok: true};
}

export async function addMember(email: string): Promise<Result> {
  const admin = await requireSuperAdmin();
  const parsed = z.email().safeParse(email.trim().toLowerCase());
  if (!parsed.success) return {ok: false, message: 'Enter a valid email address'};
  if (superAdminEmails().includes(parsed.data)) {
    return {ok: false, message: 'That email is already a super admin'};
  }
  await getDb()
    .insert(schema.teamMembers)
    .values({email: parsed.data, addedBy: admin.email})
    .onConflictDoNothing();
  revalidatePath('/admin/team');
  return {ok: true};
}

export async function removeMember(email: string): Promise<Result> {
  await requireSuperAdmin();
  await getDb().delete(schema.teamMembers).where(eq(schema.teamMembers.email, email.toLowerCase()));
  revalidatePath('/admin/team');
  return {ok: true};
}

export async function signOutAction() {
  await signOut({redirectTo: '/login'});
}

export async function resendInviteAction(actorId: string): Promise<Result> {
  await requireAdmin();
  if (!z.uuid().safeParse(actorId).success) return {ok: false, message: 'Invalid profile'};
  const [actor] = await getDb()
    .select({id: schema.actors.id, email: schema.actors.email, name: schema.actors.fullName, code: schema.actors.actorCode})
    .from(schema.actors)
    .where(eq(schema.actors.id, actorId))
    .limit(1);
  if (!actor) return {ok: false, message: 'Profile not found'};
  const account = await ensureAccount(actor.email);
  if (account.passwordHash) return {ok: false, message: 'This actor has already set up their account.'};
  const res = await sendSetupInvite(account, actor.name.split(' ')[0] || actor.name, actor.id);
  revalidatePath(`/admin/actors/${actor.code}`);
  return res.status === 'sent' ? {ok: true} : {ok: false, message: `Email not sent (${res.error})`};
}

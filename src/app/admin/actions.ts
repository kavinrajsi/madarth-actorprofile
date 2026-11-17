'use server';

import {revalidatePath} from 'next/cache';
import {after} from 'next/server';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
import {signOut} from '@/auth';
import {getDb, schema} from '@/db';
import {statusEnum} from '@/db/schema-enums';
import {getAdmin, requireAdmin, requireSuperAdmin} from '@/lib/authz';
import {superAdminEmails} from '@/lib/roles';
import {ensureAccount, findAccountByEmail, sendSetupInvite} from '@/lib/account/service';
import {resetTwoFactor} from '@/lib/account/mfa';
import {sendAndLog} from '@/lib/email/send';
import {securityEmail} from '@/lib/email/templates';
import {LEGAL} from '@/lib/legal';
import {siteUrl} from '@/lib/site-url';
import {logActivity} from '@/lib/activity';

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
  await logActivity({
    actorType: 'admin',
    adminEmail: admin.email,
    subjectActorId: actorId,
    subjectCode: current.code,
    action: 'status_changed',
    details: {from: current.status, to: parsed.data.status},
  });
  revalidatePath('/admin');
  revalidatePath(`/admin/actors/${current.code}`);
  return {ok: true};
}

export async function saveNotes(actorId: string, notes: string): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z.object({actorId: z.uuid(), notes: z.string().max(5000)}).safeParse({actorId, notes});
  if (!parsed.success) return {ok: false, message: 'Notes must be under 5000 characters'};
  const [row] = await getDb()
    .update(schema.actors)
    .set({notes: parsed.data.notes.trim() || null, updatedAt: new Date()})
    .where(eq(schema.actors.id, actorId))
    .returning({code: schema.actors.actorCode});
  // The notes text itself is never logged.
  if (row) await logActivity({actorType: 'admin', adminEmail: admin.email, subjectActorId: actorId, subjectCode: row.code, action: 'notes_saved'});
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
  await logActivity({actorType: 'admin', adminEmail: admin.email, action: 'member_added', details: {email: parsed.data}});
  revalidatePath('/admin/team');
  return {ok: true};
}

export async function removeMember(email: string): Promise<Result> {
  const admin = await requireSuperAdmin();
  const [removed] = await getDb()
    .delete(schema.teamMembers)
    .where(eq(schema.teamMembers.email, email.toLowerCase()))
    .returning({email: schema.teamMembers.email});
  if (removed) await logActivity({actorType: 'admin', adminEmail: admin.email, action: 'member_removed', details: {email: removed.email}});
  revalidatePath('/admin/team');
  return {ok: true};
}

export async function signOutAction() {
  const admin = await getAdmin();
  if (admin) await logActivity({actorType: 'admin', adminEmail: admin.email, action: 'admin_sign_out'});
  await signOut({redirectTo: '/login'});
}

export async function resendInviteAction(actorId: string): Promise<Result> {
  const admin = await requireAdmin();
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
  if (res.status === 'sent') {
    await logActivity({actorType: 'admin', adminEmail: admin.email, subjectActorId: actor.id, subjectCode: actor.code, action: 'invite_resent'});
  }
  revalidatePath(`/admin/actors/${actor.code}`);
  return res.status === 'sent' ? {ok: true} : {ok: false, message: `Email not sent (${res.error})`};
}

/** Lost phone and backup codes: clear the actor's two-factor so they set it up again at next sign-in. */
export async function resetTwoFactorAction(actorId: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(actorId).success) return {ok: false, message: 'Invalid profile'};
  const [actor] = await getDb()
    .select({email: schema.actors.email, code: schema.actors.actorCode})
    .from(schema.actors)
    .where(eq(schema.actors.id, actorId))
    .limit(1);
  if (!actor) return {ok: false, message: 'Profile not found'};
  const account = await findAccountByEmail(actor.email);
  if (!account?.totpEnabledAt) return {ok: false, message: 'Two-factor is not set up for this actor.'};
  await resetTwoFactor(account.id);
  await logActivity({actorType: 'admin', adminEmail: admin.email, subjectActorId: actorId, subjectCode: actor.code, action: 'two_factor_reset'});
  after(() =>
    sendAndLog({
      to: account.email,
      kind: 'security',
      actorId,
      email: securityEmail({
        heading: 'Two-factor sign-in was reset',
        message:
          'The Madarth casting team reset two-factor sign-in on your account, as requested. You have been signed out. Next time you sign in you will set up your authenticator app again.',
        loginUrl: `${siteUrl()}/account/login`,
        contactEmail: LEGAL.privacyEmail,
      }),
    }),
  );
  revalidatePath(`/admin/actors/${actor.code}`);
  return {ok: true};
}

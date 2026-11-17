import {desc} from 'drizzle-orm';
import {AddMember, RemoveMember} from '@/components/admin/TeamControls';
import {getDb, schema} from '@/db';
import {requireSuperAdmin} from '@/lib/authz';
import {superAdminEmails} from '@/lib/roles';
import styles from '@/components/admin/admin.module.css';

export default async function TeamPage() {
  const me = await requireSuperAdmin();
  const members = await getDb()
    .select()
    .from(schema.teamMembers)
    .orderBy(desc(schema.teamMembers.createdAt));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="mad-eyebrow">Access</span>
          <h1 className={styles.title}>Casting team</h1>
        </div>
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Add a team member</h2>
        <p className={styles.meta}>
          Members sign in with Google using this email. They can search profiles, update status and add notes,
          but cannot manage the team.
        </p>
        <AddMember />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Members ({members.length})</h2>
        {members.length === 0 ? (
          <p className={styles.meta}>No team members yet.</p>
        ) : (
          <ul className={styles.memberList}>
            {members.map((m) => (
              <li key={m.email}>
                <div>
                  <div>{m.email}</div>
                  <div className={styles.meta}>Added by {m.addedBy}</div>
                </div>
                <RemoveMember email={m.email} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Super admins</h2>
        <p className={styles.meta}>Set in the SUPER_ADMIN_EMAILS environment variable. Change them in Vercel project settings.</p>
        <ul className={styles.memberList}>
          {superAdminEmails().map((e) => (
            <li key={e}>
              <div>
                {e}
                {e === me.email && <span className={styles.meta}> (you)</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

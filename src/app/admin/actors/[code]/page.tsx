import {BackLink} from '@/components/site/BackLink';
import {notFound} from 'next/navigation';
import {Gallery} from '@/components/admin/Gallery';
import {NotesEditor} from '@/components/admin/NotesEditor';
import {StatusBadge} from '@/components/admin/StatusBadge';
import {ResendInvite} from '@/components/admin/ResendInvite';
import {ResetTwoFactor} from '@/components/admin/ResetTwoFactor';
import {ActivityList} from '@/components/activity/ActivityList';
import {Pager} from '@/components/admin/Pager';
import {logActivity, recentlyViewed} from '@/lib/activity';
import {profileActivity} from '@/lib/activity-queries';
import {StatusControl} from '@/components/admin/StatusControl';
import {requireAdmin} from '@/lib/authz';
import {GENDER_LABEL, STATUS_LABEL} from '@/lib/constants';
import {getActorByCode} from '@/lib/queries';
import {findAccountByEmail} from '@/lib/account/service';
import {desc, eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {whatsappLink} from '@/lib/text';
import {ageFromDob} from '@/lib/age';
import styles from '@/components/admin/admin.module.css';

const dob = new Intl.DateTimeFormat('en-IN', {dateStyle: 'long', timeZone: 'UTC'});
const dt = new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'});

function Item({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

function Ext({href}: {href: string}) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {href.replace(/^https?:\/\//, '')}
    </a>
  );
}

const ACTIVITY_PAGE_SIZE = 20;

export default async function ActorPage({
  params,
  searchParams,
}: {
  params: Promise<{code: string}>;
  searchParams: Promise<{ap?: string}>;
}) {
  const admin = await requireAdmin();
  const {code} = await params;
  const activityPage = Math.max(1, Number.parseInt((await searchParams).ap ?? '1', 10) || 1);
  const data = await getActorByCode(decodeURIComponent(code));
  if (!data) notFound();
  const {actor: a, photos, history} = data;
  // Accountability for personal data: who opened this profile (once per 30 min per admin).
  if (!(await recentlyViewed(admin.email, a.id))) {
    await logActivity({actorType: 'admin', adminEmail: admin.email, subjectActorId: a.id, subjectCode: a.actorCode, action: 'profile_viewed'});
  }
  const [account, emails] = await Promise.all([
    findAccountByEmail(a.email),
    getDb()
      .select()
      .from(schema.emailEvents)
      .where(eq(schema.emailEvents.actorId, a.id))
      .orderBy(desc(schema.emailEvents.at))
      .limit(20),
  ]);
  const activity = await profileActivity(a.id, account?.id ?? null, activityPage, ACTIVITY_PAGE_SIZE);
  const EMAIL_LABEL = {thank_you: 'Thank-you', invite: 'Account invite', password_reset: 'Password reset', email_change: 'Email change', security: 'Security alert'} as const;

  return (
    <>
      <div>
        <BackLink href="/admin" label="All profiles" />
      </div>
      <div className={styles.pageHead}>
        <div>
          <span className="mad-eyebrow">{a.actorCode}</span>
          <h1 className={styles.title}>{a.fullName}</h1>
          <div className={styles.row} style={{marginTop: 8}}>
            <StatusBadge status={a.status} />
            {a.possibleDuplicate && <span className={styles.dup}>Possible duplicate</span>}
            <span className={styles.meta}>Submitted {dt.format(a.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className={styles.profile}>
        <div>
          <Gallery photos={photos} name={a.fullName} />
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          <section className={styles.panel} aria-label="Casting status">
            <StatusControl actorId={a.id} status={a.status} />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Contact &amp; social media</h2>
            <dl className={styles.dl}>
              <Item label="Contact number">
                <a href={`tel:${a.phone}`}>{a.phone}</a>
              </Item>
              <Item label="WhatsApp">
                <a href={whatsappLink(a.whatsapp)} target="_blank" rel="noreferrer">
                  {a.whatsapp}
                </a>
              </Item>
              <Item label="Email">
                <a href={`mailto:${a.email}`}>{a.email}</a>
              </Item>
              <Item label="Instagram">
                {a.instagramUrl ? (
                  <a href={a.instagramUrl} target="_blank" rel="noreferrer noopener">
                    {a.instagramHandle ? `@${a.instagramHandle}` : a.instagramUrl}
                  </a>
                ) : null}
              </Item>
              {a.youtubeUrl && (
                <Item label="YouTube">
                  <Ext href={a.youtubeUrl} />
                </Item>
              )}
              {a.facebookUrl && (
                <Item label="Facebook">
                  <Ext href={a.facebookUrl} />
                </Item>
              )}
              {a.otherSocialLinks.map((l, i) => (
                <Item key={l} label={i === 0 ? 'Other social media' : ''}>
                  <Ext href={l} />
                </Item>
              ))}
              {a.guardianName && (
                <>
                  <Item label="Parent / guardian">{a.guardianName}</Item>
                  <Item label="Guardian phone">
                    {a.guardianPhone && <a href={`tel:${a.guardianPhone}`}>{a.guardianPhone}</a>}
                  </Item>
                </>
              )}
            </dl>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Basic details</h2>
            <dl className={styles.dl}>
              <Item label="Date of birth">{dob.format(new Date(`${a.dateOfBirth}T00:00:00Z`))}</Item>
              <Item label="Age">{ageFromDob(a.dateOfBirth)}</Item>
              <Item label="Gender">{GENDER_LABEL[a.gender]}</Item>
              <Item label="City">{a.city}</Item>
              <Item label="Height">{a.heightCm ? `${a.heightCm} cm` : null}</Item>
              <Item label="Languages">{a.languages.join(', ')}</Item>
              <Item label="Current profession">{a.profession}</Item>
              <Item label="Availability">{a.availability}</Item>
              <Item label="Willing to travel">{a.willingToTravel ? 'Yes' : 'No'}</Item>
            </dl>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Introduction</h2>
            <p className={styles.prose}>{a.intro}</p>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Acting experience</h2>
            <p className={styles.prose}>{a.experience || '—'}</p>
            {(
              [
                ['Showreel / audition videos', a.showreelUrls],
                ['Portfolio links', a.portfolioLinks],
              ] as const
            ).map(([title, links]) =>
              links.length > 0 ? (
                <div key={title} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  <h3 style={{fontSize: 15, margin: 0, color: 'var(--mad-muted)', fontWeight: 400}}>{title}</h3>
                  <ul className={styles.linkList}>
                    {links.map((l) => (
                      <li key={l}>
                        <Ext href={l} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Internal notes</h2>
            <NotesEditor actorId={a.id} initial={a.notes ?? ''} />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Actor account &amp; emails</h2>
            <p className={styles.meta}>
              {account?.passwordHash
                ? `Account active${account.lastLoginAt ? `, last sign-in ${dt.format(account.lastLoginAt)}` : ''}.`
                : 'Account not set up yet (actor has not created a password).'}
            </p>
            {account?.passwordHash && (
              <p className={styles.meta}>
                {account.totpEnabledAt
                  ? `Two-factor on since ${dt.format(account.totpEnabledAt)}.`
                  : 'Two-factor not set up yet (asked for at next sign-in).'}
              </p>
            )}
            {!account?.passwordHash && <ResendInvite actorId={a.id} />}
            {account?.totpEnabledAt && <ResetTwoFactor actorId={a.id} />}
            <ul className={styles.history}>
              {emails.length === 0 && <li>No emails sent yet.</li>}
              {emails.map((e) => (
                <li key={e.id}>
                  {dt.format(e.at)}: {EMAIL_LABEL[e.kind]}: {e.status}
                  {e.error ? ` (${e.error})` : ''}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Activity</h2>
            <ActivityList
              entries={activity.rows}
              audience="admin"
              showWho
              emptyText="No activity recorded yet."
            />
            {activity.total > ACTIVITY_PAGE_SIZE && (
              <Pager
                page={activityPage}
                totalItems={activity.total}
                pageSize={ACTIVITY_PAGE_SIZE}
                param="ap"
                label="Activity pages"
              />
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>History</h2>
            <ul className={styles.history}>
              {history.map((h) => (
                <li key={h.id}>
                  {dt.format(h.at)}: {h.fromStatus ? STATUS_LABEL[h.fromStatus] : '—'} → {STATUS_LABEL[h.toStatus]} by{' '}
                  {h.byEmail}
                </li>
              ))}
              <li>
                {dt.format(a.createdAt)}: Profile submitted. Consent given ({a.consentVersion})
                {a.guardianConsent ? ', with parent/guardian consent' : ''}.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

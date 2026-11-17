import Link from 'next/link';
import {asc, inArray} from 'drizzle-orm';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Step, Stepper} from '@astryxdesign/core/Stepper';
import {DeleteProfile} from '@/components/account/AccountControls';
import {MaterialIcon} from '@/components/icons/MaterialIcon';
import {getDb, schema} from '@/db';
import {ageFromDob} from '@/lib/age';
import {GENDER_LABEL} from '@/lib/constants';
import {profileChecklist} from '@/lib/account/profile-strength';
import {profilesForAccount} from '@/lib/account/service';
import {requireActorAccount} from '@/lib/account/session';
import {ACTOR_STATUS_LABEL} from '@/lib/account/status-label';
import {logoutAction} from './actions';
import styles from '@/components/account/account.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeZone: 'Asia/Kolkata'});
const dobFmt = new Intl.DateTimeFormat('en-IN', {dateStyle: 'long', timeZone: 'UTC'});
const STEPS = ['new', 'shortlisted', 'contacted', 'selected'] as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{saved?: string; welcome?: string; deleted?: string; p?: string}>;
}) {
  const account = await requireActorAccount();
  const {saved, welcome, deleted, p: selectedCode} = await searchParams;
  const profiles = await profilesForAccount(account.email);
  const profile = profiles.find((x) => x.actorCode === selectedCode) ?? profiles[0];

  if (!profile) {
    return (
      <div className={styles.column}>
        <header className={styles.head}>
          <span className="mad-eyebrow">My account</span>
          <h1 className={styles.title}>Your account</h1>
        </header>
        <p className={styles.text}>
          There are no profiles linked to this email. <Link href="/">Register as an actor</Link>.
        </p>
      </div>
    );
  }

  const photos = await getDb()
    .select({actorId: schema.actorPhotos.actorId, id: schema.actorPhotos.id, kind: schema.actorPhotos.kind})
    .from(schema.actorPhotos)
    .where(inArray(schema.actorPhotos.actorId, [profile.id]))
    .orderBy(asc(schema.actorPhotos.sort));
  const headshot = photos.find((x) => x.kind === 'headshot');
  const status = ACTOR_STATUS_LABEL[profile.status];
  const stepIndex = STEPS.indexOf(profile.status as (typeof STEPS)[number]);
  const checklist = profileChecklist(profile, photos.map((x) => x.kind));
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / checklist.length) * 100);
  const first = profile.fullName.split(' ')[0] || profile.fullName;
  const editHref = `/account/profiles/${profile.actorCode}/edit`;

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashHead}>
        <div className={styles.head}>
          <span className="mad-eyebrow">My account</span>
          <h1 className={styles.title}>Hi, {first}</h1>
          <p className={styles.text}>Here&apos;s where your casting profile stands.</p>
        </div>
      </header>

      {welcome && <Banner status="success" title="Your password is set. You're signed in." />}
      {saved && <Banner status="success" title={`Profile ${saved} saved.`} />}
      {deleted && <Banner status="success" title="Profile deleted." />}

      {profiles.length > 1 && (
        <nav className={styles.switcher} aria-label="Your profiles">
          {profiles.map((x) => (
            <Link
              key={x.id}
              href={`/account?p=${x.actorCode}`}
              aria-current={x.id === profile.id ? 'page' : undefined}
              className={styles.switch}
            >
              {x.actorCode}
            </Link>
          ))}
        </nav>
      )}

      <div className={styles.grid}>
        {/* Profile column */}
        <aside className={styles.profileCard} aria-label="Profile">
          {headshot ? (
            // Private photo route checks this actor owns the profile.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.headshot} src={`/api/photos/${headshot.id}`} alt={`Headshot of ${profile.fullName}`} />
          ) : (
            <div className={styles.headshot} aria-hidden="true" />
          )}
          <div className={styles.profileBody}>
            <h2 className={styles.name}>{profile.fullName}</h2>
            <dl className={styles.idList}>
              <div>
                <dt>Actor ID</dt>
                <dd className={styles.code}>{profile.actorCode}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{dateFmt.format(profile.createdAt)}</dd>
              </div>
              <div>
                <dt>Photos</dt>
                <dd>{photos.length}</dd>
              </div>
            </dl>
            <Button href={editHref} variant="primary" label="Edit profile" icon={<MaterialIcon name="edit" size={18} />} width="100%" />
          </div>
        </aside>

        <div className={styles.main}>
          {/* Casting status */}
          <section className={styles.card} aria-labelledby="status-h">
            <div className={styles.cardHead}>
              <h2 id="status-h" className={styles.cardTitle}>
                Casting status
              </h2>
              <span className={styles.status} data-status={profile.status}>
                {status.label}
              </span>
            </div>
            {profile.status === 'not_suitable' ? (
              <p className={styles.text}>{status.note}</p>
            ) : (
              <>
                <Stepper activeStep={stepIndex} label="Casting progress" density="compact">
                  <Step step={0} label="Received" />
                  <Step step={1} label="Shortlisted" />
                  <Step step={2} label="Contacted" />
                  <Step step={3} label="Selected" status={profile.status === 'selected' ? 'success' : undefined} />
                </Stepper>
                <p className={styles.text}>{status.note}</p>
              </>
            )}
          </section>

          {/* Profile strength */}
          <section className={styles.card} aria-labelledby="strength-h">
            <div className={styles.cardHead}>
              <h2 id="strength-h" className={styles.cardTitle}>
                Profile strength
              </h2>
              <span className={styles.meta}>
                {done} of {checklist.length} complete
              </span>
            </div>
            <ProgressBar
              label="Profile strength"
              isLabelHidden
              value={pct}
              variant={pct >= 75 ? 'success' : pct >= 40 ? 'warning' : 'error'}
              hasValueLabel
            />
            <ul className={styles.checklist}>
              {checklist.map((c) => (
                <li key={c.key} data-done={c.done ? 'true' : undefined}>
                  <MaterialIcon name={c.done ? 'check_circle' : 'radio_button_unchecked'} size={20} />
                  <span>
                    <span className={styles.checkLabel}>{c.label}</span>
                    {!c.done && <span className={styles.checkHint}>{c.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {done < checklist.length && (
              <div>
                <Button href={editHref} variant="secondary" size="sm" label="Complete your profile" />
              </div>
            )}
          </section>

          {/* Details */}
          <section className={styles.card} aria-labelledby="details-h">
            <div className={styles.cardHead}>
              <h2 id="details-h" className={styles.cardTitle}>
                Your details
              </h2>
              <Link href={editHref} className={styles.textLink}>
                Edit
              </Link>
            </div>
            <MetadataList columns="multi">
              <MetadataListItem label="Date of birth">
                {dobFmt.format(new Date(`${profile.dateOfBirth}T00:00:00Z`))} ({ageFromDob(profile.dateOfBirth)})
              </MetadataListItem>
              <MetadataListItem label="Gender">{GENDER_LABEL[profile.gender]}</MetadataListItem>
              <MetadataListItem label="City">{profile.city}</MetadataListItem>
              <MetadataListItem label="Contact number">{profile.phone}</MetadataListItem>
              <MetadataListItem label="WhatsApp">{profile.whatsapp}</MetadataListItem>
              <MetadataListItem label="Languages">{profile.languages.join(', ')}</MetadataListItem>
              <MetadataListItem label="Height">{profile.heightCm ? `${profile.heightCm} cm` : '—'}</MetadataListItem>
              <MetadataListItem label="Willing to travel">{profile.willingToTravel ? 'Yes' : 'No'}</MetadataListItem>
            </MetadataList>
          </section>

          {/* Account settings */}
          <section className={styles.card} aria-labelledby="settings-h">
            <h2 id="settings-h" className={styles.cardTitle}>
              Account settings
            </h2>
            <ul className={styles.settings}>
              <li>
                <MaterialIcon name="mail" />
                <div className={styles.settingBody}>
                  <span className={styles.settingLabel}>Login email</span>
                  <span className={styles.meta}>{account.email}</span>
                </div>
              </li>
              <li>
                <MaterialIcon name="lock" />
                <div className={styles.settingBody}>
                  <span className={styles.settingLabel}>Password</span>
                  <span className={styles.meta}>
                    {account.passwordSetAt ? `Last changed ${dateFmt.format(account.passwordSetAt)}` : 'Set'}
                  </span>
                </div>
                <Button href="/account/forgot" variant="secondary" size="sm" label="Reset password" />
              </li>
              <li>
                <MaterialIcon name="logout" />
                <div className={styles.settingBody}>
                  <span className={styles.settingLabel}>Sign out</span>
                  <span className={styles.meta}>Sign out of this device.</span>
                </div>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary" size="sm" label="Sign out" />
                </form>
              </li>
            </ul>
          </section>

          {/* Danger zone */}
          <section className={`${styles.card} ${styles.dangerCard}`} aria-labelledby="danger-h">
            <h2 id="danger-h" className={styles.cardTitle}>
              Delete profile
            </h2>
            <p className={styles.text}>
              Permanently remove profile {profile.actorCode} and all its photos. This withdraws your consent and cannot
              be undone.
            </p>
            <div>
              <DeleteProfile code={profile.actorCode} isLast={profiles.length === 1} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

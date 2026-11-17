import Link from 'next/link';
import {asc, inArray} from 'drizzle-orm';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {ChangeEmailForm, DeleteProfile} from '@/components/account/AccountControls';
import {getDb, schema} from '@/db';
import {profilesForAccount} from '@/lib/account/service';
import {requireActorAccount} from '@/lib/account/session';
import {ACTOR_STATUS_LABEL} from '@/lib/account/status-label';
import {logoutAction} from './actions';
import styles from '@/components/account/account.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeZone: 'Asia/Kolkata'});

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{saved?: string; welcome?: string; deleted?: string}>;
}) {
  const account = await requireActorAccount();
  const {saved, welcome, deleted} = await searchParams;
  const profiles = await profilesForAccount(account.email);

  const headshots = profiles.length
    ? await getDb()
        .select({actorId: schema.actorPhotos.actorId, id: schema.actorPhotos.id, kind: schema.actorPhotos.kind})
        .from(schema.actorPhotos)
        .where(inArray(schema.actorPhotos.actorId, profiles.map((p) => p.id)))
        .orderBy(asc(schema.actorPhotos.sort))
    : [];
  const headshotFor = (actorId: string) => headshots.find((h) => h.actorId === actorId && h.kind === 'headshot')?.id;

  return (
    <div className={styles.column}>
      <div className={styles.topbar}>
        <header className={styles.head}>
          <span className="mad-eyebrow">My account</span>
          <h1 className={styles.title}>{profiles[0] ? `Hi, ${profiles[0].fullName.split(' ')[0]}` : 'Your account'}</h1>
        </header>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" label="Sign out" />
        </form>
      </div>

      {welcome && <Banner status="success" title="Your password is set. You're signed in." />}
      {saved && <Banner status="success" title={`Profile ${saved} saved.`} />}
      {deleted && <Banner status="success" title="Profile deleted." />}

      {profiles.length === 0 ? (
        <p className={styles.text}>
          There are no profiles linked to this email. <Link href="/">Register as an actor</Link>.
        </p>
      ) : (
        profiles.map((p) => {
          const st = ACTOR_STATUS_LABEL[p.status];
          const photo = headshotFor(p.id);
          return (
            <article key={p.id} className={styles.card}>
              {photo ? (
                // Private photo route checks this actor owns the profile.
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.photo} src={`/api/photos/${photo}`} alt={`Headshot of ${p.fullName}`} />
              ) : (
                <div className={styles.photo} aria-hidden="true" />
              )}
              <div className={styles.cardBody}>
                <h2 className={styles.name}>{p.fullName}</h2>
                <p className={styles.meta}>
                  Actor ID {p.actorCode} · Submitted {dateFmt.format(p.createdAt)}
                </p>
                <span className={styles.status} data-status={p.status}>
                  {st.label}
                </span>
                <p className={styles.text}>{st.note}</p>
                <div className={styles.actions}>
                  <Button href={`/account/profiles/${p.actorCode}/edit`} variant="primary" size="sm" label="Edit profile" />
                  <DeleteProfile code={p.actorCode} isLast={profiles.length === 1} />
                </div>
              </div>
            </article>
          );
        })
      )}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Login details</h2>
        <ChangeEmailForm current={account.email} />
        <p className={styles.meta}>
          Forgot your password later? Use <Link href="/account/forgot" style={{color: 'var(--mad-yellow)'}}>reset password</Link>.
        </p>
      </section>
    </div>
  );
}

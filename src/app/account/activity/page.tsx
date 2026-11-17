import type {Metadata} from 'next';
import {ActivityList} from '@/components/activity/ActivityList';
import {Pager} from '@/components/admin/Pager';
import {BackLink} from '@/components/site/BackLink';
import {actorActivity} from '@/lib/activity-queries';
import {profilesForAccount} from '@/lib/account/service';
import {requireActorAccount} from '@/lib/account/session';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Account activity', robots: {index: false}};

const PAGE_SIZE = 25;

export default async function AccountActivityPage({searchParams}: {searchParams: Promise<{page?: string}>}) {
  const account = await requireActorAccount();
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? '1', 10) || 1);
  const profiles = await profilesForAccount(account.email);
  const {rows, total} = await actorActivity(account.id, profiles.map((p) => p.id), page, PAGE_SIZE);
  return (
    <div className={styles.column}>
      <div>
        <BackLink href="/account" label="My account" />
      </div>
      <header className={styles.head}>
        <span className="mad-eyebrow">My account</span>
        <h1 className={styles.title}>Account activity</h1>
        <p className={styles.text}>
          Sign-ins, security changes and profile updates from the last 2 years, with the device, approximate location
          and IP address used.
        </p>
      </header>
      <section className={styles.card}>
        <ActivityList entries={rows} audience="actor" />
      </section>
      {total > PAGE_SIZE && <Pager page={page} totalItems={total} pageSize={PAGE_SIZE} label="Activity pages" />}
    </div>
  );
}

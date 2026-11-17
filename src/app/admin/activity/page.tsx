import type {Metadata} from 'next';
import {ActivityList} from '@/components/activity/ActivityList';
import {ActivityFilters} from '@/components/admin/ActivityFilters';
import {Pager} from '@/components/admin/Pager';
import {allActivity, loggedAdmins, parseActivityFilters} from '@/lib/activity-queries';
import {requireAdmin} from '@/lib/authz';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {title: 'Activity log', robots: {index: false}};

const PAGE_SIZE = 50;

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const filters = parseActivityFilters(await searchParams);
  const [{rows, total}, admins] = await Promise.all([allActivity(filters, PAGE_SIZE), loggedAdmins()]);
  const start = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(filters.page * PAGE_SIZE, total);

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="mad-eyebrow">Talent database</span>
          <h1 className={styles.title}>Activity log</h1>
          <p className={styles.meta}>Admin and actor activity from the last 2 years. Times are IST.</p>
        </div>
      </div>

      <ActivityFilters initial={filters} admins={admins} />

      <p className={styles.resultMeta} aria-live="polite">
        {total === 0 ? 'No activity matches these filters.' : `Showing ${start}–${end} of ${total} entries`}
      </p>

      <section className={styles.panel}>
        <ActivityList entries={rows} audience="admin" showWho emptyText="Nothing to show." />
      </section>

      {total > PAGE_SIZE && (
        <div className={styles.pager}>
          <Pager page={filters.page} totalItems={total} pageSize={PAGE_SIZE} label="Activity pages" />
        </div>
      )}
    </>
  );
}

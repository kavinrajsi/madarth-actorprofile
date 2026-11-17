import Link from 'next/link';
import {Filters} from '@/components/admin/Filters';
import {Pager} from '@/components/admin/Pager';
import {Results} from '@/components/admin/Results';
import {ADMIN_PAGE_SIZE, STATUS_OPTIONS} from '@/lib/constants';
import {filterOptions, listActors, parseFilters, statusCounts} from '@/lib/queries';
import {requireAdmin} from '@/lib/authz';
import styles from '@/components/admin/admin.module.css';

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseFilters(params);
  const [{rows, total}, options, counts] = await Promise.all([
    listActors(filters),
    filterOptions(),
    statusCounts(),
  ]);
  const totalAll = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  const statusHref = (status?: string) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === 'status' || k === 'page' || v === undefined) continue;
      sp.set(k, Array.isArray(v) ? v.join(',') : v);
    }
    if (status) sp.set('status', status);
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : '/admin';
  };

  const start = total === 0 ? 0 : (filters.page - 1) * ADMIN_PAGE_SIZE + 1;
  const end = Math.min(filters.page * ADMIN_PAGE_SIZE, total);

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="mad-eyebrow">Talent database</span>
          <h1 className={styles.title}>Actor profiles</h1>
        </div>
        <nav className={styles.counts} aria-label="Filter by status">
          <Link href={statusHref()} className={styles.countChip} aria-current={!filters.status ? 'true' : undefined}>
            All<b>{totalAll}</b>
          </Link>
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s.value}
              href={statusHref(s.value)}
              className={styles.countChip}
              aria-current={filters.status === s.value ? 'true' : undefined}
            >
              {s.label}
              <b>{counts[s.value] ?? 0}</b>
            </Link>
          ))}
        </nav>
      </div>

      <Filters
        initial={filters}
        cityOptions={options.cities}
        languageOptions={options.languages}
      />

      <p className={styles.resultMeta} aria-live="polite">
        {total === 0 ? 'No profiles match these filters.' : `Showing ${start}–${end} of ${total} profiles`}
      </p>

      <Results rows={rows.map((r) => ({...r, createdAt: r.createdAt.toISOString()}))} />

      {total > ADMIN_PAGE_SIZE && (
        <div className={styles.pager}>
          <Pager page={filters.page} totalItems={total} pageSize={ADMIN_PAGE_SIZE} />
        </div>
      )}
    </>
  );
}

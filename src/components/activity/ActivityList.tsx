import Link from 'next/link';
import {describeActivity} from '@/lib/activity-actions';
import type {ActivityRow} from '@/lib/activity-queries';
import styles from './activity.module.css';

const when = new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'});

function who(e: ActivityRow): string {
  if (e.actorType === 'admin') return e.adminEmail ?? 'Admin';
  if (e.actorType === 'system') return 'System';
  return e.subjectCode ? `Actor ${e.subjectCode}` : 'Actor';
}

/**
 * Activity entries as a list. `audience="actor"` hides casting-team identity, admin-only events
 * and admin device details. Masked from Clarity recordings (contains IPs and locations).
 */
export function ActivityList({
  entries,
  audience,
  showWho = false,
  emptyText = 'No activity yet.',
}: {
  entries: ActivityRow[];
  audience: 'actor' | 'admin';
  /** Admin lists: show who acted and link the profile. */
  showWho?: boolean;
  emptyText?: string;
}) {
  const items = entries
    .map((e) => ({e, view: describeActivity(e, audience)}))
    .filter((x): x is {e: ActivityRow; view: NonNullable<typeof x.view>} => x.view !== null);

  if (!items.length) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <ol className={styles.list} data-clarity-mask="True">
      {items.map(({e, view}) => (
        <li key={e.id} className={view.isWarning ? styles.warning : undefined}>
          <div className={styles.line}>
            <span className={styles.text}>{view.text}</span>
            <time dateTime={e.at} className={styles.when}>
              {when.format(new Date(e.at))}
            </time>
          </div>
          <div className={styles.meta}>
            {showWho && <span className={styles.who}>{who(e)}</span>}
            {showWho && e.subjectCode && e.actorType !== 'actor' && (
              <span>
                {e.subjectActorId ? <Link href={`/admin/actors/${e.subjectCode}`}>{e.subjectCode}</Link> : `${e.subjectCode} (deleted)`}
              </span>
            )}
            {view.showDevice && e.device && <span>{e.device}</span>}
            {view.showDevice && e.location && <span>{e.location}</span>}
            {view.showDevice && e.ip && <span className={styles.ip}>{e.ip}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

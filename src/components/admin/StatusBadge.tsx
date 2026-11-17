import type {ActorStatus} from '@/db/schema';
import {STATUS_LABEL} from '@/lib/constants';
import styles from './admin.module.css';

/** Lightness-distinct status chips (not hue alone): outline, yellow, orange, white, grey. */
export function StatusBadge({status}: {status: ActorStatus}) {
  return (
    <span className={styles.status} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

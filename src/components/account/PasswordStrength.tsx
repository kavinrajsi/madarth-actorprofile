'use client';

import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {passwordStrength} from '@/lib/account/password-strength';
import styles from './account.module.css';

const VARIANT = ['error', 'error', 'warning', 'success', 'success'] as const;

/** Strength meter shown under a new-password field. Label text is shown too, so it never relies on colour alone. */
export function PasswordStrength({password}: {password: string}) {
  if (!password) return null;
  const s = passwordStrength(password);
  return (
    <div className={styles.strength} aria-live="polite">
      <ProgressBar
        label="Password strength"
        value={s.score === 0 ? 8 : s.score * 25}
        max={100}
        variant={VARIANT[s.score]}
        hasValueLabel
        formatValueLabel={() => s.label}
      />
      {s.tips.length > 0 && <p className={styles.strengthTips}>{s.tips.join(' · ')}</p>}
    </div>
  );
}

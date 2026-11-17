import type {Metadata} from 'next';
import {ForgotForm} from '@/components/account/AuthForms';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Forgot password'};

export default function ForgotPage() {
  return (
    <div className={`${styles.column} ${styles.narrow}`}>
      <header className={styles.head}>
        <span className="mad-eyebrow">Actors</span>
        <h1 className={styles.title}>Forgot password</h1>
        <p className={styles.text}>
          Enter the email you registered with. We&apos;ll send a link to reset your password, or to set one up if you
          haven&apos;t yet.
        </p>
      </header>
      <ForgotForm />
    </div>
  );
}

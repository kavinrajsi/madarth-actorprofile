import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {LoginForm} from '@/components/account/AuthForms';
import {getActorAccount} from '@/lib/account/session';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Actor sign in'};

const NOTICES: Record<string, {status: 'success' | 'warning' | 'error'; title: string}> = {
  'email-changed': {status: 'success', title: 'Email updated. Sign in with your new email.'},
  'email-taken': {status: 'error', title: 'That email already has an account, so it was not changed.'},
  'email-change-failed': {status: 'error', title: 'We could not change your email. Please try again.'},
  'link-expired': {status: 'warning', title: 'That link has expired or was already used.'},
  deleted: {status: 'success', title: 'Your profile and photos have been deleted.'},
};

export default async function LoginPage({searchParams}: {searchParams: Promise<{notice?: string}>}) {
  const {notice} = await searchParams;
  if (await getActorAccount()) redirect('/account');
  const n = notice ? NOTICES[notice] : undefined;
  return (
    <div className={`${styles.column} ${styles.narrow}`}>
      <header className={styles.head}>
        <span className="mad-eyebrow">Actors</span>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.text}>View your casting status and update your profile.</p>
      </header>
      {n && <Banner status={n.status} title={n.title} />}
      <LoginForm />
    </div>
  );
}

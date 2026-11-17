import type {Metadata} from 'next';
import Link from 'next/link';
import {Banner} from '@astryxdesign/core/Banner';
import {SetPasswordForm} from '@/components/account/AuthForms';
import {peekToken} from '@/lib/account/service';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Set up your account'};

export default async function Page({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token = ''} = await searchParams;
  const valid = await peekToken(token, 'setup');
  return (
    <div className={`${styles.column} ${styles.narrow}`}>
      <header className={styles.head}>
        <span className="mad-eyebrow">Actors</span>
        <h1 className={styles.title}>Set up your account</h1>
        <p className={styles.text}>Create a password to view your casting status and update your profile.</p>
      </header>
      {valid ? (
        <SetPasswordForm token={token} email={valid.email} mode="setup" />
      ) : (
        <>
          <Banner status="warning" title="This link has expired or was already used." />
          <p className={styles.text}>
            <Link href="/account/forgot">Request a new link</Link> or <Link href="/account/login">sign in</Link>.
          </p>
        </>
      )}
    </div>
  );
}

import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {applyEmailChange} from '@/lib/account/email-change';
import {peekToken} from '@/lib/account/service';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Confirm new email'};

async function confirm(formData: FormData) {
  'use server';
  const notice = await applyEmailChange(String(formData.get('token') ?? ''));
  redirect(`/account/login?notice=${notice}`);
}

// Opening the link only shows this page; the change happens on the button press (POST),
// so email security scanners that pre-open links can't use the token up.
export default async function ConfirmEmailPage({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token = ''} = await searchParams;
  const pending = await peekToken(token, 'email_change');
  return (
    <div className={`${styles.column} ${styles.narrow}`}>
      <header className={styles.head}>
        <span className="mad-eyebrow">Actors</span>
        <h1 className={styles.title}>Confirm new email</h1>
      </header>
      {pending?.newEmail ? (
        <form action={confirm} className={styles.form}>
          <input type="hidden" name="token" value={token} />
          <p className={styles.text}>
            Change your login email from <strong>{pending.email}</strong> to <strong>{pending.newEmail}</strong>?
          </p>
          <div className={styles.actions}>
            <Button type="submit" variant="primary" size="lg" label="Confirm email change" />
          </div>
        </form>
      ) : (
        <>
          <Banner status="warning" title="This link has expired or was already used." />
          <p className={styles.text}>
            <Link href="/account/login">Sign in</Link> to request a new one.
          </p>
        </>
      )}
    </div>
  );
}

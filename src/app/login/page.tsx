import type {Metadata} from 'next';
import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {getAdmin} from '@/lib/authz';
import {signInWithGoogle} from './actions';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import styles from '@/components/site/site.module.css';

export const metadata: Metadata = {title: 'Casting team sign in', robots: {index: false}};

function safeCallback(v: string | undefined): string {
  return v && v.startsWith('/admin') && !v.startsWith('//') ? v : '/admin';
}

type SP = Promise<{error?: string; callbackUrl?: string}>;

export default function LoginPage({searchParams}: {searchParams: SP}) {
  return (
    <>
      <SiteHeader />
      <main className={`mad-container ${styles.center}`}>
        <Suspense fallback={<div className={styles.hero} />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function LoginContent({searchParams}: {searchParams: SP}) {
  const {error, callbackUrl} = await searchParams;
  const target = safeCallback(callbackUrl);
  if (await getAdmin()) redirect(target);

  return (
        <div className={styles.hero}>
          <span className="mad-eyebrow">Casting team</span>
          <h1 className={styles.heroTitle}>Sign in to the talent database.</h1>
          {error && (
            <Banner
              status="error"
              title={error === 'AccessDenied' ? 'This account is not authorised' : 'Sign-in failed'}
              description={
                error === 'AccessDenied'
                  ? 'Ask a Madarth super admin to add your Google account email to the casting team.'
                  : 'Please try again.'
              }
            />
          )}
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={target} />
            <Button type="submit" variant="primary" size="lg" label="Sign in with Google" />
          </form>
        </div>
  );
}

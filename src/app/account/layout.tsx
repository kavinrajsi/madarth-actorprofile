import type {Metadata} from 'next';
import {Suspense} from 'react';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'My account', robots: {index: false}};

export default function AccountLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <SiteHeader />
      <main className="mad-container">
        <Suspense fallback={<div className={styles.column}><p className={styles.text}>Loading…</p></div>}>
          {children}
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

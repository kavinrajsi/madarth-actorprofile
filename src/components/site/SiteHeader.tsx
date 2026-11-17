import Link from 'next/link';
import {POLICY_LINKS} from '@/lib/legal';
import {Year} from './Year';
import styles from './site.module.css';

export function SiteHeader({end}: {end?: React.ReactNode}) {
  return (
    <header className={styles.header}>
      <div className={`mad-container ${styles.headerInner}`}>
        <Link href="/" className={styles.wordmark} aria-label="Madarth casting home">
          MADARTH<sup>®</sup>
        </Link>
        {end}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`mad-container ${styles.footerInner}`}>
        <nav aria-label="Policies" className={styles.footerNav}>
          <Link href="/account/login">Actor sign in</Link>
          {POLICY_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <p className={styles.footerLegal}>
          © <Year /> Madarth® | All rights reserved.
        </p>
      </div>
    </footer>
  );
}

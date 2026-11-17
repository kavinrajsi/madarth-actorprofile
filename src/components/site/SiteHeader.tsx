import Link from 'next/link';
import {POLICY_LINKS} from '@/lib/legal';
import {Logo} from './Logo';
import {Year} from './Year';
import styles from './site.module.css';

export function SiteHeader({end}: {end?: React.ReactNode}) {
  return (
    <header className={styles.header}>
      <div className={`mad-container ${styles.headerInner}`}>
        <Link href="/" className={styles.wordmark} aria-label="Madarth casting home">
          <Logo className={styles.logo} />
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
        <p className={styles.footerLegal}>
          © 2011–<Year /> Madarth® | All rights reserved.
        </p>
        <nav aria-label="Policies" className={styles.footerNav}>
          {POLICY_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

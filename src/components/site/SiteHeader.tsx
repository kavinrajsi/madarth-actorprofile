import Link from 'next/link';
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
      <div className="mad-container">© <Year /> Madarth® | All rights reserved.</div>
    </footer>
  );
}

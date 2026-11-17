import Link from 'next/link';
import {Button} from '@astryxdesign/core/Button';
import {HELP_LINKS, POLICY_LINKS} from '@/lib/legal';
import {Logo} from './Logo';
import {Year} from './Year';
import styles from './site.module.css';

/** Actor sign-in button shown at the top right of public pages. */
export function SignInButton() {
  return <Button href="/account/login" variant="secondary" size="sm" label="Sign in" />;
}

/** `end` overrides the right-hand side; omit it for the default Sign in button, pass null for nothing. */
export function SiteHeader({end}: {end?: React.ReactNode}) {
  return (
    <header className={styles.header}>
      <div className={`mad-container ${styles.headerInner}`}>
        <Link href="/" className={styles.wordmark} aria-label="Madarth casting home">
          <Logo className={styles.logo} />
        </Link>
        {end === undefined ? <SignInButton /> : end}
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
        <nav aria-label="Help and policies" className={styles.footerNav}>
          {[...HELP_LINKS, ...POLICY_LINKS].map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

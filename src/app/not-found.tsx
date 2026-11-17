import type {Metadata} from 'next';
import {Button} from '@astryxdesign/core/Button';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import styles from '@/components/site/site.module.css';

export const metadata: Metadata = {title: 'Page not found', robots: {index: false}};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className={`mad-container ${styles.center}`}>
        <div className={styles.hero}>
          <span className="mad-eyebrow">404 — Page not found</span>
          <h1 className={styles.heroTitle}>This page doesn&apos;t exist.</h1>
          <p className={styles.heroText}>The link may be broken or the page may have moved.</p>
          <div>
            <Button href="/" variant="primary" label="Go to registration" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

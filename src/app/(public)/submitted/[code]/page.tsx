import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import styles from '@/components/site/site.module.css';

export const metadata: Metadata = {title: 'Profile submitted', robots: {index: false}};

async function Code({params}: {params: Promise<{code: string}>}) {
  const {code} = await params;
  return <>{decodeURIComponent(code).replace(/[^A-Z0-9-]/gi, '').slice(0, 20)}</>;
}

export default function SubmittedPage({params}: {params: Promise<{code: string}>}) {
  return (
    <>
      <SiteHeader />
      <main className={`mad-container ${styles.center}`}>
        <div className={styles.hero}>
          <span className="mad-eyebrow">Profile submitted</span>
          <h1 className={styles.heroTitle}>Thank you. We have your profile.</h1>
          <p className={styles.heroText}>Your actor registration ID is</p>
          <div>
            <span className={styles.codeBox}>
              <Suspense fallback="…">
                <Code params={params} />
              </Suspense>
            </span>
          </div>
          <p className={styles.heroText}>
            Keep this ID for any follow-up. Our casting team will contact you on WhatsApp or email if
            you are shortlisted for a project.
          </p>
          <div>
            <Button label="Submit another profile" href="/" variant="secondary" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

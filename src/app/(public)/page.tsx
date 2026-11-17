import {ProfileForm} from '@/components/form/ProfileForm';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import styles from '@/components/site/site.module.css';

export default function RegisterPage() {
  // Evaluated at build time (the page is static): pick the upload flow that matches the Blob credentials.
  const uploadMode = process.env.BLOB_READ_WRITE_TOKEN ? 'token' : 'presigned';
  return (
    <>
      <SiteHeader />
      <main className="mad-container">
        <div className={styles.hero}>
          <span className="mad-eyebrow">Casting call</span>
          <h1 className={styles.heroTitle}>
            Register as an <span className={styles.highlight}>actor</span> with Madarth.
          </h1>
          <p className={styles.heroText}>
            Share your details, photographs and acting experience. Our casting team reviews every
            profile for upcoming films, ads and campaigns. It takes about 10 minutes.
          </p>
        </div>
        <div className={styles.narrow}>
          <ProfileForm uploadMode={uploadMode} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

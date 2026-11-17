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
        <h1 className="mad-visually-hidden">Actor registration</h1>
        <div className={styles.formColumn}>
          <ProfileForm uploadMode={uploadMode} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

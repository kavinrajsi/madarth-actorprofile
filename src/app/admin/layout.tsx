import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {AdminNav} from '@/components/admin/AdminNav';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import {requireAdmin} from '@/lib/authz';
import {signOutAction} from './actions';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {title: 'Talent database', robots: {index: false}};

export default function AdminLayout({children}: {children: React.ReactNode}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

function AdminLoading() {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={`mad-container ${styles.main}`}>
        <p className={styles.meta}>Loading…</p>
      </main>
    </div>
  );
}

async function AdminShell({children}: {children: React.ReactNode}) {
  const admin = await requireAdmin();
  return (
    <div className={styles.shell}>
      <SiteHeader
        end={
          <div className={styles.nav}>
            <AdminNav isSuperAdmin={admin.role === 'super_admin'} />
            <span className={styles.who}>{admin.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" label="Sign out" />
            </form>
          </div>
        }
      />
      <main className={`mad-container ${styles.main}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}

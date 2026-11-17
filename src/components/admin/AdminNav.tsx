'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import styles from './admin.module.css';

export function AdminNav({isSuperAdmin}: {isSuperAdmin: boolean}) {
  const path = usePathname();
  const items = [
    {href: '/admin', label: 'Profiles', active: path === '/admin' || path.startsWith('/admin/actors')},
    {href: '/admin/activity', label: 'Activity', active: path.startsWith('/admin/activity')},
    ...(isSuperAdmin ? [{href: '/admin/team', label: 'Team', active: path.startsWith('/admin/team')}] : []),
  ];
  return (
    <nav aria-label="Admin" className={styles.nav}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={styles.navLink} aria-current={i.active ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

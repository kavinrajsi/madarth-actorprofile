import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';

export const metadata: Metadata = {title: 'Page not found', robots: {index: false}};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mad-container mad-404">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link href="/">Go to home</Link>
      </main>
      <SiteFooter />
    </>
  );
}

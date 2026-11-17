import type {Metadata} from 'next';
import Link from 'next/link';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'The sign-in and analytics cookies used on the Madarth actor registration site.',
};

const sections = [
  {id: 'summary', title: 'In short'},
  {id: 'public', title: 'Registration form'},
  {id: 'analytics', title: 'Analytics cookies'},
  {id: 'actor', title: 'Actor account'},
  {id: 'admin', title: 'Casting team dashboard'},
  {id: 'manage', title: 'Managing cookies'},
  {id: 'contact', title: 'Contact'},
];

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" sections={sections}>
      <Section id="summary" title="In short">
        <p>
          On casting.madarth.com we use analytics cookies from Google Analytics and Microsoft Clarity to understand how
          the site is used. We use no advertising cookies. Sign-in cookies keep you signed in to your actor account or
          the casting team dashboard.
        </p>
      </Section>

      <Section id="public" title="Registration form">
        <p>
          The registration form itself does not need cookies. Photos you add are uploaded directly to our private
          storage. On casting.madarth.com, the analytics cookies below are set when the page loads.
        </p>
      </Section>

      <Section id="analytics" title="Analytics cookies">
        <p>Loaded through Google Tag Manager, only on casting.madarth.com:</p>
        <ul>
          <li>
            <strong>Google Analytics</strong> (<code>_ga</code>, <code>_ga_*</code>): count visits and pages viewed;
            kept for up to 2 years.
          </li>
          <li>
            <strong>Microsoft Clarity</strong> (<code>_clck</code>, <code>_clsk</code>, and Microsoft&apos;s{' '}
            <code>MUID</code>, <code>CLID</code>): link page views into a session for heatmaps and session recordings;
            kept from 1 day up to 1 year.
          </li>
        </ul>
        <p>
          Session recordings can include text you type into forms (not passwords). See our{' '}
          <Link href="/privacy">Privacy Policy</Link> for details.
        </p>
      </Section>

      <Section id="actor" title="Actor account">
        <p>
          When you sign in to your actor account, we set one strictly necessary cookie that keeps you signed in for up to
          7 days. It holds a signed reference to your account, not your details, and is removed when you sign out.
        </p>
      </Section>

      <Section id="admin" title="Casting team dashboard">
        <p>When a Madarth staff member signs in with Google, these strictly necessary cookies are set:</p>
        <ul>
          <li>
            <strong>Session cookie</strong>: keeps the staff member signed in (up to 7 days).
          </li>
          <li>
            <strong>Security (CSRF) cookie</strong>: protects the sign-in from forged requests.
          </li>
          <li>
            <strong>Callback cookie</strong>: remembers which page to return to after sign-in.
          </li>
        </ul>
        <p>Google may set its own cookies during sign-in, under Google&apos;s privacy policy.</p>
      </Section>

      <Section id="manage" title="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings. Blocking analytics cookies does not affect the
          registration form. Blocking all cookies means you will not be able to sign in to your actor account (and staff
          cannot sign in to the dashboard). You can also install Google&apos;s Analytics opt-out browser add-on.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions: <Email />. See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}

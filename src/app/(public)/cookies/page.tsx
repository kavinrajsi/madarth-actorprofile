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
  {id: 'staff', title: 'Staff sign-in'},
  {id: 'manage', title: 'Managing cookies'},
  {id: 'contact', title: 'Contact'},
];

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" sections={sections}>
      <Section id="summary" title="In short">
        <p>
          casting.madarth.com uses analytics cookies from Google Analytics and Microsoft Clarity to see how the site is
          used. We don&apos;t use advertising cookies. Sign-in cookies keep you signed in to your actor account.
        </p>
      </Section>

      <Section id="public" title="Registration form">
        <p>
          The registration form doesn&apos;t need cookies to work. Photos you add go straight to our private storage. On
          casting.madarth.com, the analytics cookies below are set when the page loads.
        </p>
      </Section>

      <Section id="analytics" title="Analytics cookies">
        <p>These load through Google Tag Manager, and only on casting.madarth.com.</p>
        <ul>
          <li>
            Google Analytics sets <code>_ga</code> and <code>_ga_*</code> to count visits and pages viewed. They last up
            to 2 years.
          </li>
          <li>
            Microsoft Clarity sets <code>_clck</code> and <code>_clsk</code>, plus Microsoft&apos;s <code>MUID</code>{' '}
            and <code>CLID</code>, to tie page views into one visit for heatmaps and session recordings. They last
            anywhere from 1 day to 1 year.
          </li>
        </ul>
        <p>
          Session recordings can include what you type into forms, but never passwords. Our{' '}
          <Link href="/privacy">Privacy Policy</Link> has the details.
        </p>
      </Section>

      <Section id="actor" title="Actor account">
        <p>
          When you sign in, we set a cookie that keeps you signed in for up to 7 days. It holds a signed reference to
          your account, not your details, and it&apos;s removed when you sign out.
        </p>
        <p>
          Two short-lived cookies help with two-step sign-in. One remembers that you&apos;ve entered your password while
          you enter your code, and expires after 10 minutes. The other holds a one-time check while you use a passkey,
          and expires after 5 minutes.
        </p>
        <p>All three are strictly necessary. You can&apos;t sign in without them.</p>
      </Section>

      <Section id="staff" title="Staff sign-in">
        <p>
          Madarth staff sign in with Google. That sets strictly necessary cookies of its own: one keeps them signed in
          for up to 7 days, one protects the sign-in from forged requests, and one remembers which page to return to.
          Google may also set its own cookies during sign-in, under Google&apos;s privacy policy.
        </p>
      </Section>

      <Section id="manage" title="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings. Blocking analytics cookies doesn&apos;t affect the
          registration form. If you block all cookies, you won&apos;t be able to sign in to your actor account. You can
          also install Google&apos;s Analytics opt-out add-on for your browser.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions? Email <Email />. You can also read our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}

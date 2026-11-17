import type {Metadata} from 'next';
import Link from 'next/link';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'The cookies used on the Madarth actor registration site.',
};

const sections = [
  {id: 'summary', title: 'In short'},
  {id: 'public', title: 'Registration form'},
  {id: 'admin', title: 'Casting team dashboard'},
  {id: 'manage', title: 'Managing cookies'},
  {id: 'contact', title: 'Contact'},
];

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" sections={sections}>
      <Section id="summary" title="In short">
        <p>
          This site uses no advertising or analytics cookies. The only cookies are the ones needed for our casting
          team to sign in.
        </p>
      </Section>

      <Section id="public" title="Registration form">
        <p>
          The registration form and policy pages do not set cookies. Your form entries stay in your browser until you
          submit them. Photos you add are uploaded directly to our private storage.
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
          You can clear or block cookies in your browser settings. Blocking them does not affect the registration form;
          staff will not be able to sign in to the dashboard.
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

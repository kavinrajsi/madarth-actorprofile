import type {Metadata} from 'next';
import Link from 'next/link';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';
import {LEGAL} from '@/lib/legal';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms for submitting an actor profile to Madarth.',
};

const sections = [
  {id: 'no-fees', title: 'We never charge a fee'},
  {id: 'eligibility', title: 'Who can register'},
  {id: 'your-info', title: 'Your information'},
  {id: 'your-content', title: 'Your photos and links'},
  {id: 'account', title: 'Your account'},
  {id: 'no-guarantee', title: 'No guarantee of selection'},
  {id: 'acceptable-use', title: 'Acceptable use'},
  {id: 'removal', title: 'Removing profiles'},
  {id: 'liability', title: 'Limitation of liability'},
  {id: 'law', title: 'Governing law'},
  {id: 'contact', title: 'Contact'},
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      sections={sections}
      intro={
        <p>
          This site is run by {LEGAL.legalEntity}, which owns the {LEGAL.companyName} brand. If you submit a profile
          here, you agree to these terms, our{' '}
          <Link href="/privacy">Privacy Policy</Link> and our <Link href="/photo-consent">Photo &amp; Consent Policy</Link>.
        </p>
      }
    >
      <Section id="no-fees" title="We never charge a fee">
        <div className={styles.callout}>
          <p>
            <strong>
              {LEGAL.companyName} never asks actors for money to register, audition, be shortlisted or get a role.
            </strong>{' '}
            If someone claiming to be from {LEGAL.companyName} asks you to pay, don&apos;t. Report it to <Email />.
          </p>
        </div>
      </Section>

      <Section id="eligibility" title="Who can register">
        <p>
          Anyone can register. If you&apos;re under 18, a parent or legal guardian has to fill in their own details and
          give consent on the form.
        </p>
      </Section>

      <Section id="your-info" title="Your information">
        <p>
          Everything you submit has to be true, up to date and about you. Don&apos;t submit a profile for someone else
          unless you&apos;re their parent or legal guardian.
        </p>
      </Section>

      <Section id="your-content" title="Your photos and links">
        <ul>
          <li>You must own the photos you upload, or have the photographer&apos;s permission to share them.</li>
          <li>The photos must be of you, not of other people.</li>
          <li>Don&apos;t upload nudity, offensive material or anything illegal.</li>
          <li>
            Your photos stay yours. You let us use them for casting, as set out in our{' '}
            <Link href="/photo-consent">Photo &amp; Consent Policy</Link>.
          </li>
        </ul>
      </Section>

      <Section id="account" title="Your account">
        <p>
          After you register, we email you a link to set a password for your actor account. Every sign-in also needs a
          second step: a code from your authenticator app, a passkey or a backup code. Keep your password and backup
          codes to yourself, because you&apos;re responsible for what happens on your account. If you think someone else
          has got in, reset your password straight away and tell us at <Email />.
        </p>
      </Section>

      <Section id="no-guarantee" title="No guarantee of selection">
        <p>
          Submitting a profile doesn&apos;t guarantee an audition, a role or any work. We get in touch only when a
          project needs you, and we can&apos;t always reply to every submission.
        </p>
      </Section>

      <Section id="acceptable-use" title="Acceptable use">
        <ul>
          <li>Don&apos;t pretend to be someone else or give false or misleading information.</li>
          <li>Don&apos;t send spam, automated submissions or a pile of duplicate profiles.</li>
          <li>Don&apos;t try to get into staff-only parts of the site or other people&apos;s data, or disrupt the site.</li>
        </ul>
      </Section>

      <Section id="removal" title="Removing profiles">
        <p>
          We may remove a profile that breaks these terms, has false information in it or is no longer needed. You can
          delete yours from your account at any time, or ask us to by emailing <Email />.
        </p>
      </Section>

      <Section id="liability" title="Limitation of liability">
        <p>
          The site is provided &quot;as is&quot;. As far as the law allows, {LEGAL.legalEntity} ({LEGAL.companyName}) is
          not liable for any indirect loss from using the site or from not being chosen for a role. Nothing in these
          terms limits your rights under Indian consumer or data protection law.
        </p>
      </Section>

      <Section id="law" title="Governing law">
        <p>
          Indian law governs these terms. Any dispute goes to the courts in {LEGAL.jurisdiction}.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions about these terms? Email <Email />. {LEGAL.legalEntity} ({LEGAL.companyName}), {LEGAL.address}.
        </p>
      </Section>
    </LegalPage>
  );
}

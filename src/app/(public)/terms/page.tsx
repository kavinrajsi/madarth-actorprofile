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
          This site is run by {LEGAL.legalEntity}, which owns the {LEGAL.companyName} brand. By submitting a profile on
          this site you agree to these terms, our{' '}
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
            If anyone claiming to be from {LEGAL.companyName} asks you for a payment, do not pay. Report it to <Email />.
          </p>
        </div>
      </Section>

      <Section id="eligibility" title="Who can register">
        <p>
          Anyone can register. If you are under 18, a parent or legal guardian must fill in their details and give
          consent on the form.
        </p>
      </Section>

      <Section id="your-info" title="Your information">
        <p>
          The details you submit must be true, current and your own. Do not submit a profile for someone else unless
          you are their parent or legal guardian.
        </p>
      </Section>

      <Section id="your-content" title="Your photos and links">
        <ul>
          <li>You must own the photographs you upload, or have permission from the photographer to share them.</li>
          <li>Photographs must be of you. Do not upload pictures of other people.</li>
          <li>Do not upload nudity, offensive material or anything unlawful.</li>
          <li>
            You keep the rights to your photographs. You give us permission to use them for casting as described in
            our <Link href="/photo-consent">Photo &amp; Consent Policy</Link>.
          </li>
        </ul>
      </Section>

      <Section id="no-guarantee" title="No guarantee of selection">
        <p>
          Submitting a profile does not guarantee an audition, a role or any work. We contact actors only when a
          project needs them, and we may not be able to reply to every submission.
        </p>
      </Section>

      <Section id="acceptable-use" title="Acceptable use">
        <ul>
          <li>Do not impersonate anyone or submit false or misleading information.</li>
          <li>Do not submit spam, automated submissions or many duplicate profiles.</li>
          <li>Do not try to access the casting dashboard or other people&apos;s data, or disrupt the site.</li>
        </ul>
      </Section>

      <Section id="removal" title="Removing profiles">
        <p>
          We may remove a profile that breaks these terms, contains false information or is no longer needed. You can
          ask us to remove yours at any time by emailing <Email />.
        </p>
      </Section>

      <Section id="liability" title="Limitation of liability">
        <p>
          The site is provided &quot;as is&quot;. To the extent the law allows, {LEGAL.legalEntity} ({LEGAL.companyName})
          is not liable for
          any indirect loss arising from using the site or from not being selected for a role. Nothing in these terms
          limits your rights under Indian consumer or data protection law.
        </p>
      </Section>

      <Section id="law" title="Governing law">
        <p>
          These terms are governed by the laws of India. Courts in {LEGAL.jurisdiction} have jurisdiction over any
          dispute.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions about these terms: <Email />. {LEGAL.legalEntity} ({LEGAL.companyName}), {LEGAL.address}.
        </p>
      </Section>
    </LegalPage>
  );
}

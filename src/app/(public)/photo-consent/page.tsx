import type {Metadata} from 'next';
import Link from 'next/link';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';
import {CONSENT_TEXT, GUARDIAN_CONSENT_TEXT} from '@/lib/constants';
import {LEGAL} from '@/lib/legal';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Photo & Consent Policy',
  description: 'What you agree to when you submit your photographs and details to Madarth for casting.',
};

const sections = [
  {id: 'what-you-agree', title: 'What you agree to'},
  {id: 'covers', title: 'What the consent covers'},
  {id: 'not-covered', title: 'What it does not cover'},
  {id: 'minors', title: 'Actors under 18'},
  {id: 'withdraw', title: 'Withdrawing consent'},
  {id: 'records', title: 'How we record consent'},
];

export default function PhotoConsentPage() {
  return (
    <LegalPage
      title="Photo & Consent Policy"
      sections={sections}
      intro={
        <p>
          Your photographs are personal. This page explains exactly what the consent box on our registration form
          allows us to do with them, and what it does not.
        </p>
      }
    >
      <Section id="what-you-agree" title="What you agree to">
        <p>When you tick the consent box, you agree to this statement:</p>
        <div className={styles.callout}>
          <p>&ldquo;{CONSENT_TEXT}&rdquo;</p>
        </div>
      </Section>

      <Section id="covers" title="What the consent covers">
        <ul>
          <li>Storing your photographs and details privately in our casting database.</li>
          <li>Our casting team viewing, searching and shortlisting your profile.</li>
          <li>
            Sharing your profile and photographs with the director, client or production partners of a specific project
            you are being considered for, only for that casting decision.
          </li>
          <li>Contacting you about auditions and roles.</li>
        </ul>
      </Section>

      <Section id="not-covered" title="What it does not cover">
        <ul>
          <li>
            We will <strong>not</strong> publish your photographs on our website, social media, advertising or any
            public place.
          </li>
          <li>
            We will <strong>not</strong> use your photographs in an ad, film or campaign. If you are cast, that use will
            be agreed separately in writing, including payment terms.
          </li>
          <li>We will not sell your photographs or give them to anyone for purposes other than casting.</li>
          <li>We will not edit your photographs to change how you look.</li>
        </ul>
      </Section>

      <Section id="minors" title="Actors under 18">
        <p>For an actor under 18, a parent or legal guardian must also agree to this statement on the form:</p>
        <div className={styles.callout}>
          <p>&ldquo;{GUARDIAN_CONSENT_TEXT}&rdquo;</p>
        </div>
        <p>We contact the parent or guardian about any audition or role for a minor.</p>
      </Section>

      <Section id="withdraw" title="Withdrawing consent">
        <p>
          You can withdraw your consent at any time, without giving a reason. Email <Email /> from the email address on
          your profile, with your actor registration ID if you have it. Within {LEGAL.withdrawalDays} days we will delete
          your profile and every photograph you uploaded, and confirm by email.
        </p>
        <p>
          If your profile was already shared with a project team before you withdrew, we will ask them to delete it
          too.
        </p>
      </Section>

      <Section id="records" title="How we record consent">
        <p>
          We store the date and time you gave consent and the version of the wording you agreed to, so we can show
          what you agreed to if it changes later. See our <Link href="/privacy">Privacy Policy</Link> for how long we
          keep profiles.
        </p>
      </Section>
    </LegalPage>
  );
}

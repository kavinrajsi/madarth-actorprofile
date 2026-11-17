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
          This page sets out what the consent box on our registration form lets us do with your photos, and what it
          doesn&apos;t.
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
          <li>We store your photos and details privately in our casting database.</li>
          <li>Our casting team can view, search and shortlist your profile.</li>
          <li>
            When you&apos;re being considered for a particular project, we can share your profile and photos with its
            director, client or production partners, for that casting decision only.
          </li>
          <li>We can contact you about auditions and roles.</li>
        </ul>
      </Section>

      <Section id="not-covered" title="What it does not cover">
        <ul>
          <li>We won&apos;t publish your photos on our website, on social media, in ads or anywhere else public.</li>
          <li>
            We won&apos;t put your photos in an ad, film or campaign. If you&apos;re cast, any use like that is agreed
            separately in writing, including what you&apos;ll be paid.
          </li>
          <li>We won&apos;t sell your photos or hand them to anyone for anything other than casting.</li>
          <li>We won&apos;t edit your photos to change how you look.</li>
        </ul>
      </Section>

      <Section id="minors" title="Actors under 18">
        <p>If the actor is under 18, a parent or legal guardian also has to agree to this statement on the form:</p>
        <div className={styles.callout}>
          <p>&ldquo;{GUARDIAN_CONSENT_TEXT}&rdquo;</p>
        </div>
        <p>For any audition or role, we contact the parent or guardian, not the child.</p>
      </Section>

      <Section id="withdraw" title="Withdrawing consent">
        <p>
          You can withdraw your consent at any time, and you don&apos;t have to say why. The quickest way is to delete
          your profile from your account. You can also email <Email /> from the address on your profile, with your Actor
          ID if you have it. Within {LEGAL.withdrawalDays} days we&apos;ll delete your profile and every photo you
          uploaded, and confirm by email.
        </p>
        <p>
          If we had already shared your profile with a project team, we&apos;ll ask them to delete it too.
        </p>
      </Section>

      <Section id="records" title="How we record consent">
        <p>
          We store the date and time you gave consent and the version of the wording you agreed to. If the wording
          changes later, we can still show exactly what you agreed to. Our <Link href="/privacy">Privacy Policy</Link>{' '}
          says how long we keep profiles.
        </p>
      </Section>
    </LegalPage>
  );
}

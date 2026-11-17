import type {Metadata} from 'next';
import Link from 'next/link';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';
import {LEGAL} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Madarth collects, uses, stores and protects the details and photographs actors submit.',
};

const sections = [
  {id: 'who-we-are', title: 'Who we are'},
  {id: 'what-we-collect', title: 'What we collect'},
  {id: 'why', title: 'Why we use it'},
  {id: 'legal-basis', title: 'Your consent'},
  {id: 'sharing', title: 'Who can see your profile'},
  {id: 'storage', title: 'Where your data is stored'},
  {id: 'retention', title: 'How long we keep it'},
  {id: 'security', title: 'How we protect it'},
  {id: 'rights', title: 'Your rights'},
  {id: 'children', title: 'Actors under 18'},
  {id: 'contact', title: 'Contact and grievances'},
  {id: 'changes', title: 'Changes to this policy'},
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={sections}
      intro={
        <p>
          This policy explains what happens to the details and photographs you share when you register as an actor
          with {LEGAL.companyName}. We collect only what the casting team needs, and we use it only for casting.
        </p>
      }
    >
      <Section id="who-we-are" title="Who we are">
        <p>
          {LEGAL.companyName} (&quot;we&quot;, &quot;us&quot;) is the data fiduciary responsible for your personal data under
          India&apos;s Digital Personal Data Protection Act, 2023. Our registered address is {LEGAL.address}.
        </p>
      </Section>

      <Section id="what-we-collect" title="What we collect">
        <h3>Information you give us</h3>
        <ul>
          <li>Basic details: full name, date of birth, gender, city, contact number, WhatsApp number and email address.</li>
          <li>Social media: Instagram, YouTube, Facebook and any other profile links you add.</li>
          <li>Photographs: your headshot, best pictures and full-length photograph.</li>
          <li>Acting details: introduction, previous experience, portfolio and showreel links.</li>
          <li>Additional details: languages, height, current profession, availability and willingness to travel.</li>
          <li>For actors under 18: the name, phone number and consent of a parent or legal guardian.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            A one-way scrambled (hashed) version of your network address, used only to stop spam and repeated
            submissions. We do not store your actual IP address.
          </li>
          <li>The date and time of your submission and the version of the consent you agreed to.</li>
        </ul>
        <p>We do not use analytics or advertising trackers on the registration form.</p>
      </Section>

      <Section id="why" title="Why we use it">
        <ul>
          <li>To review your profile for current and future casting requirements: films, ads, campaigns and other productions.</li>
          <li>To contact you about auditions or roles by phone, WhatsApp or email.</li>
          <li>To keep an organised talent database so the casting team can search and shortlist actors.</li>
          <li>To prevent spam, fraud and duplicate profiles.</li>
        </ul>
        <p>We do not sell your data, and we do not use it for marketing unrelated to casting.</p>
      </Section>

      <Section id="legal-basis" title="Your consent">
        <p>
          We process your data on the basis of the consent you give when you tick the consent box on the
          registration form. You can withdraw it at any time (see <a href="#rights">Your rights</a>). How we use
          photographs is explained in our <Link href="/photo-consent">Photo &amp; Consent Policy</Link>.
        </p>
      </Section>

      <Section id="sharing" title="Who can see your profile">
        <ul>
          <li>
            <strong>Madarth&apos;s casting team</strong>: authorised staff who sign in to our private dashboard.
          </li>
          <li>
            <strong>The team of a specific project</strong>: when you are considered for a role, we may share your
            profile and photographs with that project&apos;s director, client or production partners, only for that
            casting decision.
          </li>
          <li>
            <strong>Service providers who store and process data for us</strong>: Vercel (website hosting and photo
            storage), Neon (database) and Google (sign-in for our staff). They act on our instructions and may not use
            your data for their own purposes.
          </li>
          <li>
            <strong>Authorities</strong>: if the law requires it.
          </li>
        </ul>
        <p>Your photographs are stored privately and are never published on a public page.</p>
      </Section>

      <Section id="storage" title="Where your data is stored">
        <p>
          Our service providers may store data on servers outside India. Where they do, we rely on their contractual
          and security commitments and on transfers permitted under Indian law.
        </p>
      </Section>

      <Section id="retention" title="How long we keep it">
        <p>
          We keep your profile for <strong>{LEGAL.retention}</strong> from the date you submit it, or until you ask us
          to remove it, whichever is earlier. After that we delete your details and photographs. To stay in our
          database longer, you can submit a fresh profile.
        </p>
      </Section>

      <Section id="security" title="How we protect it">
        <ul>
          <li>Photographs are kept in private storage and can only be viewed by signed-in casting staff.</li>
          <li>Dashboard access is limited to approved Madarth accounts and can be removed at any time.</li>
          <li>All data travels over encrypted (HTTPS) connections.</li>
        </ul>
        <p>No system is perfectly secure, but we take reasonable steps to protect your data and will tell you and the authorities about a breach as the law requires.</p>
      </Section>

      <Section id="rights" title="Your rights">
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and how we use it;</li>
          <li>correct or update your details;</li>
          <li>delete your profile and photographs;</li>
          <li>withdraw your consent (we will then delete your profile);</li>
          <li>nominate someone to exercise these rights for you if you die or become unable to do so.</li>
        </ul>
        <p>
          Email <Email /> from the email address on your profile, and include your actor registration ID if you have
          it. We will reply within {LEGAL.withdrawalDays} days.
        </p>
      </Section>

      <Section id="children" title="Actors under 18">
        <p>
          A parent or legal guardian must give consent for an actor under 18. We use a child&apos;s data only for
          casting, never for tracking or targeted advertising. A parent or guardian can exercise all the rights above
          on the child&apos;s behalf.
        </p>
      </Section>

      <Section id="contact" title="Contact and grievances">
        <p>
          For questions, requests or complaints about your data, email our grievance contact at <Email />. If you are
          not satisfied with our response, you may complain to the Data Protection Board of India.
        </p>
        <p>
          {LEGAL.companyName}, {LEGAL.address}
        </p>
      </Section>

      <Section id="changes" title="Changes to this policy">
        <p>
          We may update this policy. The date at the top shows the latest version. If a change affects how we use your
          existing data, we will ask for your consent again where the law requires it.
        </p>
      </Section>
    </LegalPage>
  );
}

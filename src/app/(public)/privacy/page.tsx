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
  {id: 'analytics', title: 'Website analytics and session recordings'},
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
          This policy covers the details and photos you give us when you register as an actor with{' '}
          {LEGAL.companyName}. We ask only for what our casting team needs, and we use it only for casting.
        </p>
      }
    >
      <Section id="who-we-are" title="Who we are">
        <p>
          {LEGAL.companyName} is a brand of {LEGAL.legalEntity} (&quot;we&quot;, &quot;us&quot;). Under India&apos;s
          Digital Personal Data Protection Act, 2023, we are the data fiduciary for your personal data: we decide how it
          is used, and we are responsible for it. Our registered address is {LEGAL.address}.
        </p>
      </Section>

      <Section id="what-we-collect" title="What we collect">
        <h3>What you tell us on the form</h3>
        <ul>
          <li>Your name, date of birth, gender, city, phone number, WhatsApp number and email address.</li>
          <li>Links to your Instagram, YouTube, Facebook or other profiles, if you add them.</li>
          <li>Your headshot, your other pictures and your full-length photo.</li>
          <li>Your introduction, your acting experience, and links to your portfolio and showreel.</li>
          <li>The languages you speak, your height, your current job, when you&apos;re available and whether you can travel.</li>
          <li>If you&apos;re under 18, your parent or guardian&apos;s name, phone number and consent.</li>
        </ul>

        <h3>Your account</h3>
        <p>
          We keep your login email and your password. The password is stored as a one-way hash, so nobody at{' '}
          {LEGAL.companyName} can read it.
        </p>
        <p>
          For two-step sign-in we keep your authenticator key (encrypted), your backup codes (as one-way hashes) and, if
          you add a passkey, its public key. Fingerprint and Face ID checks happen on your own phone or computer. We never
          receive your fingerprint or your face.
        </p>
        <p>
          We also keep a log of your account activity: sign-ins, failed sign-in attempts, security changes and profile
          edits. Each entry records the time, the IP address, the browser and device, and the rough location (city) the
          IP address points to. You can see your own log on your account page.
        </p>

        <h3>What we record automatically</h3>
        <ul>
          <li>
            When you submit the registration form, a one-way hash of your network address, used only to stop spam and
            repeat submissions. For the form itself we don&apos;t keep the address.
          </li>
          <li>When you submitted, and which version of the consent wording you agreed to.</li>
          <li>Which emails we sent you: the type, the date and whether it was delivered, but not what it said.</li>
        </ul>
        <p>
          casting.madarth.com also uses analytics and session-recording tools. See{' '}
          <a href="#analytics">Website analytics and session recordings</a>.
        </p>
      </Section>

      <Section id="why" title="Why we use it">
        <p>
          We use your details to consider you for films, ads, campaigns and other productions, now and later, and to
          contact you about auditions and roles by phone, WhatsApp or email. We also send you account emails: a thank-you
          when you register, your account invitation, password resets and security alerts, for example when your
          two-step settings change.
        </p>
        <p>
          Keeping profiles in one database lets our casting team search and shortlist actors. It also helps us stop
          spam, fraud and duplicate profiles. The activity log lets you spot sign-ins you don&apos;t recognise, and shows
          which member of our team opened or changed your profile.
        </p>
        <p>We don&apos;t sell your data, and we don&apos;t use it for marketing that has nothing to do with casting.</p>
      </Section>

      <Section id="legal-basis" title="Your consent">
        <p>
          We use your data because you agreed to it when you ticked the consent box on the registration form. You can
          withdraw that consent whenever you like (see <a href="#rights">Your rights</a>). Our{' '}
          <Link href="/photo-consent">Photo &amp; Consent Policy</Link> explains what we can and can&apos;t do with your
          photos.
        </p>
      </Section>

      <Section id="analytics" title="Website analytics and session recordings">
        <p>
          casting.madarth.com uses Google Tag Manager, Google Analytics and Microsoft Clarity so we can see how people use
          the site and fix what&apos;s broken. These tools record the pages you visit, your clicks and scrolling, how long
          you stay on each page, your device and browser, and your rough location.
        </p>
        <p>
          Clarity also makes session recordings, which are replays of how someone used a page. A replay can include text
          shown on the page and what you type into the form, such as your name, contact details and date of birth. It
          never records passwords, and we hide sign-in links, two-step codes, authenticator keys and backup codes from
          both tools.
        </p>
        <p>
          Google and Microsoft handle this data for us and may store it outside India. We use it only to improve the
          site, never for advertising. Our <Link href="/cookies">Cookie Policy</Link> lists the analytics cookies, and you
          can block them in your browser.
        </p>
      </Section>

      <Section id="sharing" title="Who can see your profile">
        <p>
          Our casting team can see your profile after signing in. Only {LEGAL.companyName} staff we have approved can
          sign in.
        </p>
        <p>
          When we consider you for a particular role, we may share your profile and photos with that project&apos;s
          director, client or production partners. They get it for that casting decision and nothing else.
        </p>
        <p>
          A few companies store and process data for us: Vercel (website hosting and photo storage), Neon (database),
          Zoho ZeptoMail (account emails), Google (staff sign-in, Google Analytics and Tag Manager) and Microsoft (Clarity
          session recordings). They follow our instructions and can&apos;t use your data for their own purposes.
        </p>
        <p>We will share data with the authorities if the law requires it.</p>
        <p>Your photos are stored privately. They never appear on a public page.</p>
      </Section>

      <Section id="storage" title="Where your data is stored">
        <p>
          Some of these companies keep data on servers outside India. When they do, we rely on their contracts and
          security commitments, and on transfers that Indian law permits.
        </p>
      </Section>

      <Section id="retention" title="How long we keep it">
        <p>
          We keep your profile for <strong>{LEGAL.retention}</strong> from the day you submit it, or until you ask us to
          remove it, if that comes first. Then we delete your details and photos. If you want to stay in our database
          longer, submit a fresh profile.
        </p>
        <p>
          Activity records are deleted automatically after 2 years. If you delete your account, its activity records go
          with it. We keep only a note that the profile ID was deleted, with none of your details.
        </p>
      </Section>

      <Section id="security" title="How we protect it">
        <ul>
          <li>Photos sit in private storage. Only signed-in casting staff can view them.</li>
          <li>Only approved {LEGAL.companyName} accounts can sign in as staff, and we can remove that access at any time.</li>
          <li>Everything travels over encrypted (HTTPS) connections.</li>
          <li>Passwords are stored as salted one-way hashes. Sign-in links work once and then expire.</li>
          <li>Every actor sign-in needs a second step: an authenticator code, a passkey or a one-time backup code.</li>
          <li>
            When our staff open a profile, change its status or edit notes, we log their name, the time and their IP
            address, so we always know who looked at your data.
          </li>
        </ul>
        <p>
          No system is perfectly secure. We take reasonable steps to protect your data, and if there is a breach we will
          tell you and the authorities as the law requires.
        </p>
      </Section>

      <Section id="rights" title="Your rights">
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and how we use it;</li>
          <li>correct or update your details;</li>
          <li>delete your profile and photos;</li>
          <li>withdraw your consent, after which we delete your profile;</li>
          <li>accept someone you nominate to use these rights for you if you die or can no longer act yourself.</li>
        </ul>
        <p>
          You can update or delete your profile yourself once you sign in to your{' '}
          <Link href="/account/login">actor account</Link>. For anything else, email <Email /> from the address on your
          profile, with your Actor ID if you have it. We&apos;ll reply within {LEGAL.withdrawalDays} days.
        </p>
      </Section>

      <Section id="children" title="Actors under 18">
        <p>
          If the actor is under 18, a parent or legal guardian has to give consent. We use a child&apos;s data only for
          casting, never for tracking or targeted ads. A parent or guardian can use any of the rights above on the
          child&apos;s behalf.
        </p>
      </Section>

      <Section id="contact" title="Contact and grievances">
        <p>
          If you have a question, request or complaint about your data, email our grievance contact at <Email />. If
          you&apos;re not happy with our answer, you can complain to the Data Protection Board of India.
        </p>
        <p>
          {LEGAL.legalEntity} ({LEGAL.companyName}), {LEGAL.address}
        </p>
      </Section>

      <Section id="changes" title="Changes to this policy">
        <p>
          We may update this policy. The date at the top shows when we last did. If a change affects how we use data
          you&apos;ve already given us, we&apos;ll ask for your consent again where the law requires it.
        </p>
      </Section>
    </LegalPage>
  );
}

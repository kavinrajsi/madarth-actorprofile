import type {Metadata} from 'next';
import Link from 'next/link';
import {MaterialIcon} from '@/components/icons/MaterialIcon';
import {Email, LegalPage, Section} from '@/components/legal/LegalPage';
import {ACTOR_STATUS_LABEL} from '@/lib/account/status-label';
import {TOKEN_TTL_MS} from '@/lib/account/tokens';
import {BACKUP_CODE_COUNT} from '@/lib/account/backup-codes';
import {PHOTO_MAX_BYTES, PHOTO_MIN_SHORT_SIDE, PHOTO_RULES} from '@/lib/constants';
import {LEGAL} from '@/lib/legal';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers for actors registering with Madarth casting: photos, your account, two-step sign-in, status and privacy.',
};

const email = LEGAL.privacyEmail;
const setupDays = Math.round(TOKEN_TTL_MS.setup / 86_400_000);
const resetMinutes = Math.round(TOKEN_TTL_MS.reset / 60_000);
const maxMb = Math.round(PHOTO_MAX_BYTES / (1024 * 1024));
const statuses = Object.values(ACTOR_STATUS_LABEL);

type Item = {
  q: string;
  /** Plain-text answer, also used for search engines (FAQPage structured data). */
  text: string;
  /** Rich answer with links; falls back to `text`. */
  body?: React.ReactNode;
};
type Group = {id: string; title: string; items: Item[]};

const groups: Group[] = [
  {
    id: 'registering',
    title: 'Registering',
    items: [
      {
        q: 'Does it cost anything to register?',
        text: `No. ${LEGAL.companyName} never asks actors for money to register, audition, be shortlisted or get a role. If anyone claiming to be from ${LEGAL.companyName} asks you for a payment, do not pay and report it to ${email}.`,
        body: (
          <p>
            No. {LEGAL.companyName} never asks actors for money to register, audition, be shortlisted or get a role. If
            anyone claiming to be from {LEGAL.companyName} asks you for a payment, do not pay and report it to <Email />.
          </p>
        ),
      },
      {
        q: 'Who can register?',
        text: 'Anyone can register. If the actor is under 18, a parent or legal guardian must fill in their own details and give consent on the form.',
      },
      {
        q: 'Can I register more than one person with the same email?',
        text: 'Yes. A parent can register each child separately using the same email. All the profiles appear together when you sign in, and you can switch between them.',
      },
      {
        q: 'What happens after I submit?',
        text: `You get an Actor ID (for example MAD-26-00001) on screen and by email. You will also get a separate email with a link to set your password, so you can sign in later to update your profile and see your casting status.`,
      },
    ],
  },
  {
    id: 'photos',
    title: 'Photos',
    items: [
      {
        q: 'Which photos do I need?',
        text: `One front-facing headshot is required. You can also add up to ${PHOTO_RULES.gallery.max} recent pictures and ${PHOTO_RULES.full_length.max} full-length photograph. More good photos help our casting team.`,
      },
      {
        q: 'What file types and sizes are allowed?',
        text: `JPG, PNG or WebP, up to ${maxMb} MB each, and at least ${PHOTO_MIN_SHORT_SIDE} pixels on the shorter side.`,
      },
      {
        q: 'Any tips for good photos?',
        text: 'Use recent, clear photos in good light. Your face should be clearly visible, looking at the camera. Avoid sunglasses, filters, side profiles and heavily edited or blurry pictures.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Your account and signing in',
    items: [
      {
        q: 'How do I set my password?',
        text: `Open the "set your password" email we send after you submit and follow the link. The link works for ${setupDays} days. If you can't find it, check your spam folder, or use "Forgot password?" on the sign-in page with the email you registered with.`,
        body: (
          <p>
            Open the &ldquo;set your password&rdquo; email we send after you submit and follow the link. The link works for{' '}
            {setupDays} days. If you can&apos;t find it, check your spam folder, or use{' '}
            <Link href="/account/forgot">Forgot password?</Link> with the email you registered with.
          </p>
        ),
      },
      {
        q: 'I forgot my password. What do I do?',
        text: `Use "Forgot password?" on the sign-in page. We email you a reset link that works for ${resetMinutes} minutes.`,
        body: (
          <p>
            Use <Link href="/account/forgot">Forgot password?</Link> on the sign-in page. We email you a reset link that
            works for {resetMinutes} minutes.
          </p>
        ),
      },
      {
        q: 'Why do I need an authenticator app?',
        text: 'Your profile holds your photos and contact details, so every account uses two-step sign-in. After your password, you enter a 6-digit code from an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password. You set it up once by scanning a QR code.',
      },
      {
        q: 'What are backup codes?',
        text: `When you turn on two-step sign-in you get ${BACKUP_CODE_COUNT} backup codes. Each one works once, in place of the app code, if you don't have your phone. Save them somewhere safe, such as a password manager or a printed copy. You can make a new set from My account at any time.`,
      },
      {
        q: 'Can I sign in with my fingerprint or Face ID?',
        text: 'Yes. After signing in, go to My account → Sign-in security and choose "Add passkey". Next time, after your password, you can use your fingerprint or Face ID instead of typing a code.',
      },
      {
        q: 'I lost my phone and my backup codes. How do I get back in?',
        text: `Email ${email} from the email address you registered with, and include your Actor ID. Once we confirm it's you, we'll let you set up two-step sign-in again.`,
        body: (
          <p>
            Email <Email /> from the email address you registered with, and include your Actor ID. Once we confirm
            it&apos;s you, we&apos;ll let you set up two-step sign-in again.
          </p>
        ),
      },
      {
        q: 'Can I change my login email?',
        text: 'No. Your login email is fixed once you register. You can still update your phone and WhatsApp numbers from your profile.',
      },
      {
        q: 'What is "Recent activity" on my account?',
        text: "It lists your recent sign-ins, failed sign-in attempts and changes to your account, with the device and approximate location. If you see something you don't recognise, reset your password straight away.",
      },
    ],
  },
  {
    id: 'profile',
    title: 'Your profile and casting status',
    items: [
      {
        q: 'How do I update my details or photos?',
        text: 'Sign in, then choose "Edit profile" on My account. Changes are saved straight away.',
        body: (
          <p>
            <Link href="/account/login">Sign in</Link>, then choose &ldquo;Edit profile&rdquo; on My account. Changes are
            saved straight away.
          </p>
        ),
      },
      {
        q: 'What does my casting status mean?',
        text: statuses.map((s) => `${s.label}: ${s.note}`).join(' '),
        body: (
          <ul>
            {statuses.map((s) => (
              <li key={s.label}>
                <strong>{s.label}</strong>: {s.note}
              </li>
            ))}
          </ul>
        ),
      },
      {
        q: 'Will I definitely be contacted?',
        text: 'Not always. We contact actors when a role fits their profile, usually on WhatsApp or by email. Registering does not guarantee an audition or a role.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and deleting your profile',
    items: [
      {
        q: 'How long do you keep my profile?',
        text: `We keep your profile for ${LEGAL.retention} from the date you submit it, then delete your details and photos. To stay in our database longer, submit a fresh profile.`,
      },
      {
        q: 'Who can see my photos and details?',
        text: `Only ${LEGAL.companyName}'s casting team, to consider you for roles. Your profile is never public. See our Privacy Policy and Photo & Consent Policy for details.`,
        body: (
          <p>
            Only {LEGAL.companyName}&apos;s casting team, to consider you for roles. Your profile is never public. See our{' '}
            <Link href="/privacy">Privacy Policy</Link> and <Link href="/photo-consent">Photo &amp; Consent Policy</Link>{' '}
            for details.
          </p>
        ),
      },
      {
        q: 'How do I delete my profile?',
        text: `Sign in, open My account and choose "Delete profile". This removes your details and photos permanently. You can also email ${email} and we will delete it within ${LEGAL.withdrawalDays} days.`,
        body: (
          <p>
            Sign in, open My account and choose &ldquo;Delete profile&rdquo;. This removes your details and photos
            permanently. You can also email <Email /> and we will delete it within {LEGAL.withdrawalDays} days.
          </p>
        ),
      },
    ],
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: groups.flatMap((g) =>
    g.items.map((i) => ({'@type': 'Question', name: i.q, acceptedAnswer: {'@type': 'Answer', text: i.text}})),
  ),
};

export default function FaqPage() {
  return (
    <LegalPage
      title="Frequently asked questions"
      eyebrow="Help"
      sections={[...groups.map(({id, title}) => ({id, title})), {id: 'help', title: 'Still need help?'}]}
      intro={<p>Answers for actors, and parents registering a child, about submitting a profile with {LEGAL.companyName}.</p>}
    >
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can never close the script tag.
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}
      />
      {groups.map((g) => (
        <Section key={g.id} id={g.id} title={g.title}>
          <div className={styles.faqList}>
            {g.items.map((i) => (
              <details key={i.q} className={styles.faq}>
                <summary>
                  {i.q}
                  <span className={styles.faqIcon}>
                    <span className={styles.faqOpen}>
                      <MaterialIcon name="add" size={22} />
                    </span>
                    <span className={styles.faqClose}>
                      <MaterialIcon name="remove" size={22} />
                    </span>
                  </span>
                </summary>
                <div className={styles.faqAnswer}>{i.body ?? <p>{i.text}</p>}</div>
              </details>
            ))}
          </div>
        </Section>
      ))}
      <Section id="help" title="Still need help?">
        <p>
          Email <Email /> with your Actor ID and we&apos;ll get back to you.
        </p>
      </Section>
    </LegalPage>
  );
}

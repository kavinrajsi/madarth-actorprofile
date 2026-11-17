import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {AuthenticatorSetup, SignInSecondStep} from '@/components/account/TwoFactor';
import {getActorAccount, getPendingAccount} from '@/lib/account/session';
import {listPasskeys, passkeyRelyingParty} from '@/lib/account/webauthn';
import styles from '@/components/account/account.module.css';

export const metadata: Metadata = {title: 'Two-factor sign-in', robots: {index: false}};

/** Second sign-in step (or first-time authenticator setup) after the password. */
export default async function VerifyPage() {
  const pending = await getPendingAccount();
  if (!pending) {
    redirect((await getActorAccount()) ? '/account' : '/account/login?notice=signin-timeout');
  }

  if (!pending.totpEnabledAt) {
    return (
      <div className={`${styles.column} ${styles.narrow}`} data-clarity-mask="True">
        <header className={styles.head}>
          <span className="mad-eyebrow">Step 2 of 2</span>
          <h1 className={styles.title}>Protect your account</h1>
        </header>
        <AuthenticatorSetup mode="first" />
      </div>
    );
  }

  const [rp, keys] = await Promise.all([passkeyRelyingParty(), listPasskeys(pending.id)]);
  return (
    <div className={`${styles.column} ${styles.narrow}`} data-clarity-mask="True">
      <header className={styles.head}>
        <span className="mad-eyebrow">Step 2 of 2</span>
        <h1 className={styles.title}>Confirm it&apos;s you</h1>
        <p className={styles.text}>Signing in as {pending.email}</p>
      </header>
      <SignInSecondStep passkeysOffered={Boolean(rp) && keys.length > 0} />
    </div>
  );
}

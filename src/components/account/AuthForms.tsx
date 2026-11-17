'use client';

import {useState, useTransition} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {
  forgotPasswordAction,
  loginAction,
  resetPasswordAction,
  setupPasswordAction,
} from '@/app/account/actions';
import {PasswordStrength} from './PasswordStrength';
import styles from './account.module.css';

const err = (m?: string) => (m ? {type: 'error' as const, message: m} : undefined);

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await loginAction(email, password);
          if (res.ok) {
            router.push('/account/verify');
            router.refresh();
          } else setError(res.message);
        });
      }}
    >
      <TextInput label="Email ID" type="email" value={email} onChange={setEmail} autoComplete="email" isRequired width="100%" />
      <TextInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        isRequired
        width="100%"
      />
      {error && <Banner status="error" title={error} />}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" label="Sign in" isLoading={isPending} />
      </div>
      <div className={styles.links}>
        <Link href="/account/forgot">Forgot password?</Link>
        <Link href="/">Register as an actor</Link>
      </div>
    </form>
  );
}

export function SetPasswordForm({token, email, mode}: {token: string; email: string; mode: 'setup' | 'reset'}) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setErrors({});
        start(async () => {
          const action = mode === 'setup' ? setupPasswordAction : resetPasswordAction;
          const res = await action(token, password, confirm);
          if (res.ok) {
            router.push('/account/verify');
            router.refresh();
          } else {
            setErrors(res.fieldErrors ?? {});
            setError(res.message);
          }
        });
      }}
    >
      {/* Lets password managers save the login against the right email. */}
      <TextInput label="Email ID" type="email" value={email} isReadOnly autoComplete="username" width="100%" />
      <TextInput
        label={mode === 'setup' ? 'Create a password' : 'New password'}
        description="At least 8 characters, with a letter and a number."
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        isRequired
        status={err(errors.password)}
        width="100%"
      />
      <PasswordStrength password={password} />
      <TextInput
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        isRequired
        status={err(errors.confirm)}
        width="100%"
      />
      {error && !Object.keys(errors).length && <Banner status="error" title={error} />}
      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          label={mode === 'setup' ? 'Create account' : 'Save new password'}
          isLoading={isPending}
        />
      </div>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  if (sent) {
    return (
      <Banner
        status="success"
        title="Check your email"
        description="If an account exists for that address, we've sent a link. It may take a few minutes; check spam too."
      />
    );
  }
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await forgotPasswordAction(email);
          if (res.ok) setSent(true);
          else setError(res.message);
        });
      }}
    >
      <TextInput label="Email ID" type="email" value={email} onChange={setEmail} autoComplete="email" isRequired width="100%" />
      {error && <Banner status="error" title={error} />}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" label="Send link" isLoading={isPending} />
      </div>
      <div className={styles.links}>
        <Link href="/account/login">Back to sign in</Link>
      </div>
    </form>
  );
}

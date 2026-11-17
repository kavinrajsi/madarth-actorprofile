'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {deleteProfileAction, requestEmailChangeAction} from '@/app/account/actions';
import styles from './account.module.css';

const err = (m?: string) => (m ? {type: 'error' as const, message: m} : undefined);

export function ChangeEmailForm({current}: {current: string}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ok: boolean; text: string} | null>(null);
  const [isPending, start] = useTransition();

  if (!open) {
    return (
      <div className={styles.actions}>
        <p className={styles.meta}>
          Login email: <strong style={{color: 'var(--mad-paper)'}}>{current}</strong>
        </p>
        <Button variant="secondary" size="sm" label="Change email" onClick={() => setOpen(true)} />
      </div>
    );
  }
  if (message?.ok) return <Banner status="success" title={message.text} />;
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setErrors({});
        setMessage(null);
        start(async () => {
          const res = await requestEmailChangeAction(email, password);
          if (res.ok) setMessage({ok: true, text: `We sent a confirmation link to ${email}. Your email changes when you click it.`});
          else {
            setErrors(res.fieldErrors ?? {});
            setMessage({ok: false, text: res.message});
          }
        });
      }}
    >
      <TextInput label="New email" type="email" value={email} onChange={setEmail} autoComplete="email" status={err(errors.newEmail)} width="100%" />
      <TextInput
        label="Current password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        status={err(errors.password)}
        width="100%"
      />
      {message && !message.ok && !Object.keys(errors).length && <Banner status="error" title={message.text} />}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" label="Send confirmation link" isLoading={isPending} />
        <Button variant="ghost" label="Cancel" onClick={() => setOpen(false)} />
      </div>
    </form>
  );
}

export function DeleteProfile({code, isLast}: {code: string; isLast: boolean}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  if (!open) return <Button variant="ghost" size="sm" label="Delete profile" onClick={() => setOpen(true)} />;
  return (
    <div className={styles.danger}>
      <p style={{margin: 0}}>
        This permanently deletes profile <strong>{code}</strong> and all its photos. It cannot be undone.
        {isLast ? ' Your account will be closed too.' : ''}
      </p>
      <TextInput label="Type DELETE to confirm" value={text} onChange={setText} autoComplete="off" status={err(error ?? undefined)} width="100%" />
      <div className={styles.actions}>
        <Button
          variant="destructive"
          label="Delete permanently"
          isLoading={isPending}
          isDisabled={text.trim().toUpperCase() !== 'DELETE'}
          onClick={() =>
            start(async () => {
              const res = await deleteProfileAction(code, text);
              if (!res.ok) return setError(res.message);
              router.push(isLast ? '/account/login?notice=deleted' : '/account?deleted=1');
              router.refresh();
            })
          }
        />
        <Button variant="ghost" label="Cancel" onClick={() => setOpen(false)} />
      </div>
    </div>
  );
}

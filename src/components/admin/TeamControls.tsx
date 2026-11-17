'use client';

import {useState, useTransition} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {addMember, removeMember} from '@/app/admin/actions';
import styles from './admin.module.css';

export function AddMember() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return (
    <form
      className={styles.addMember}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await addMember(email);
          if (res.ok) setEmail('');
          else setError(res.message);
        });
      }}
    >
      <TextInput
        label="Google account email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="off"
        status={error ? {type: 'error', message: error} : undefined}
        width="100%"
      />
      <Button type="submit" variant="primary" label="Add member" isLoading={isPending} />
    </form>
  );
}

export function RemoveMember({email}: {email: string}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  if (!confirming) return <Button variant="ghost" size="sm" label="Remove" onClick={() => setConfirming(true)} />;
  return (
    <div className={styles.row}>
      <Button
        variant="destructive"
        size="sm"
        label="Confirm remove"
        isLoading={isPending}
        onClick={() => startTransition(async () => void (await removeMember(email)))}
      />
      <Button variant="ghost" size="sm" label="Cancel" onClick={() => setConfirming(false)} />
    </div>
  );
}

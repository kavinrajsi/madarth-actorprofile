'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {deleteProfileAction} from '@/app/account/actions';
import styles from './account.module.css';

const err = (m?: string) => (m ? {type: 'error' as const, message: m} : undefined);

export function DeleteProfile({code, isLast}: {code: string; isLast: boolean}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const typed = text.trim().toUpperCase() === 'DELETE';

  function reset() {
    setOpen(false);
    setConfirmOpen(false);
    setText('');
    setError(null);
  }

  if (!open) return <Button variant="ghost" size="sm" label="Delete profile" onClick={() => setOpen(true)} />;
  return (
    <div className={styles.danger}>
      {/* Step 1: type DELETE */}
      <p style={{margin: 0}}>
        This permanently deletes profile <strong>{code}</strong> and all its photos. It cannot be undone.
        {isLast ? ' Your account will be closed too.' : ''}
      </p>
      <TextInput label="Type DELETE to confirm" value={text} onChange={setText} autoComplete="off" status={err(error ?? undefined)} width="100%" />
      <div className={styles.actions}>
        <Button variant="destructive" label="Delete profile" isDisabled={!typed} onClick={() => setConfirmOpen(true)} />
        <Button variant="ghost" label="Cancel" onClick={reset} />
      </div>

      {/* Step 2: final confirmation */}
      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={(o) => !isPending && setConfirmOpen(o)}
        title={`Delete profile ${code}?`}
        description={`Your details and all photos will be removed for good and the casting team will no longer see this profile.${isLast ? ' Your account will be closed and you will be signed out.' : ''} This cannot be undone.`}
        actionLabel="Yes, delete permanently"
        cancelLabel="Keep my profile"
        isActionLoading={isPending}
        onAction={() =>
          start(async () => {
            const res = await deleteProfileAction(code, text);
            if (!res.ok) {
              setConfirmOpen(false);
              return setError(res.message);
            }
            router.push(isLast ? '/account/login?notice=deleted' : '/account?deleted=1');
            router.refresh();
          })
        }
      />
    </div>
  );
}

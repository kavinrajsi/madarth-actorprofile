'use client';

import {useState, useTransition} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Button} from '@astryxdesign/core/Button';
import {resetTwoFactorAction} from '@/app/admin/actions';
import styles from './admin.module.css';

/** For an actor who lost their phone and backup codes. */
export function ResetTwoFactor({actorId}: {actorId: string}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  return (
    <div className={styles.row}>
      <Button variant="secondary" size="sm" label="Reset two-factor" onClick={() => setOpen(true)} />
      {msg && <span className={styles.saved}>{msg}</span>}
      <AlertDialog
        isOpen={open}
        onOpenChange={(o) => !isPending && setOpen(o)}
        title="Reset two-factor for this actor?"
        description="Only do this after confirming the actor's identity (for example by phone). Their authenticator, backup codes and passkeys are removed and they are signed out. They set up two-factor again at next sign-in."
        actionLabel="Reset two-factor"
        isActionLoading={isPending}
        onAction={() =>
          start(async () => {
            const res = await resetTwoFactorAction(actorId);
            setOpen(false);
            setMsg(res.ok ? 'Two-factor reset. The actor has been emailed.' : res.message);
          })
        }
      />
    </div>
  );
}

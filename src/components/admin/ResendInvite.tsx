'use client';

import {useState, useTransition} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {resendInviteAction} from '@/app/admin/actions';
import styles from './admin.module.css';

export function ResendInvite({actorId}: {actorId: string}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  return (
    <div className={styles.row}>
      <Button
        variant="secondary"
        size="sm"
        label="Resend account invite"
        isLoading={isPending}
        onClick={() =>
          start(async () => {
            const res = await resendInviteAction(actorId);
            setMsg(res.ok ? 'Invite sent.' : res.message);
          })
        }
      />
      {msg && <span className={styles.saved}>{msg}</span>}
    </div>
  );
}

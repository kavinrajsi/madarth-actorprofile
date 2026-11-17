'use client';

import {useState, useTransition} from 'react';
import {Selector} from '@astryxdesign/core/Selector';
import {updateStatus} from '@/app/admin/actions';
import type {ActorStatus} from '@/db/schema';
import {STATUS_OPTIONS} from '@/lib/constants';
import styles from './admin.module.css';

export function StatusControl({actorId, status}: {actorId: string; status: ActorStatus}) {
  const [value, setValue] = useState<string>(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <Selector
        label="Casting status"
        options={STATUS_OPTIONS}
        value={value}
        isLoading={isPending}
        onChange={(next) => {
          const prev = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const res = await updateStatus(actorId, next);
            if (!res.ok) {
              setValue(prev);
              setError(res.message);
            }
          });
        }}
        width="100%"
      />
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

'use client';

import {useState, useTransition} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextArea} from '@astryxdesign/core/TextArea';
import {saveNotes} from '@/app/admin/actions';
import styles from './admin.module.css';

export function NotesEditor({actorId, initial}: {actorId: string; initial: string}) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dirty = notes !== saved;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
      <TextArea
        label="Notes for the casting team"
        isLabelHidden
        value={notes}
        onChange={setNotes}
        rows={4}
        maxLength={5000}
        placeholder="Audition feedback, projects considered, follow-up reminders…"
        width="100%"
      />
      <div className={styles.row}>
        <Button
          label="Save notes"
          variant="secondary"
          isDisabled={!dirty}
          isLoading={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await saveNotes(actorId, notes);
              if (res.ok) {
                setSaved(notes);
                setMsg('Saved');
              } else setMsg(res.message);
            })
          }
        />
        {msg && !dirty && <span className={styles.saved}>{msg}</span>}
      </div>
    </div>
  );
}

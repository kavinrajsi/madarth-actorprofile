'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@astryxdesign/core/Button';
import {DateRangeInput, type DateRange} from '@astryxdesign/core/DateRangeInput';
import {Selector} from '@astryxdesign/core/Selector';
import {ACTIVITY_ACTIONS} from '@/lib/activity-actions';
import type {ActivityFilters as Values} from '@/lib/activity-queries';
import styles from './admin.module.css';

const ANY = '';
const ACTION_OPTIONS = Object.entries(ACTIVITY_ACTIONS).map(([value, label]) => ({value, label}));

export function ActivityFilters({initial, admins}: {initial: Values; admins: string[]}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [who, setWho] = useState<string>(initial.who ?? ANY);
  const [admin, setAdmin] = useState<string>(initial.admin ?? ANY);
  const [action, setAction] = useState<string>(initial.action ?? ANY);
  const [range, setRange] = useState<DateRange | null>(
    initial.from && initial.to ? ({start: initial.from, end: initial.to} as DateRange) : null,
  );

  function go(sp: URLSearchParams) {
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/admin/activity?${qs}` : '/admin/activity'));
  }

  return (
    <form
      className={styles.filters}
      role="search"
      aria-label="Filter activity"
      onSubmit={(e) => {
        e.preventDefault();
        const sp = new URLSearchParams();
        if (who) sp.set('who', who);
        if (admin) sp.set('admin', admin);
        if (action) sp.set('action', action);
        if (range) {
          sp.set('from', range.start);
          sp.set('to', range.end);
        }
        go(sp);
      }}
    >
      <Selector
        label="Who"
        options={[
          {value: ANY, label: 'Everyone'},
          {value: 'admin', label: 'Admins'},
          {value: 'actor', label: 'Actors'},
        ]}
        value={who}
        onChange={setWho}
        width="100%"
      />
      <Selector
        label="Admin"
        options={[{value: ANY, label: 'Any admin'}, ...admins.map((a) => ({value: a, label: a}))]}
        value={admin}
        onChange={setAdmin}
        hasSearch
        width="100%"
      />
      <Selector
        label="Action"
        options={[{value: ANY, label: 'Any action'}, ...ACTION_OPTIONS]}
        value={action}
        onChange={setAction}
        hasSearch
        width="100%"
      />
      <div className={styles.filtersWide}>
        <DateRangeInput label="Between" value={range} onChange={setRange} />
      </div>
      <div className={styles.filterActions}>
        <Button type="submit" variant="primary" label="Apply filters" isLoading={isPending} />
        <Button
          variant="ghost"
          label="Reset"
          onClick={() => {
            setWho(ANY);
            setAdmin(ANY);
            setAction(ANY);
            setRange(null);
            go(new URLSearchParams());
          }}
        />
      </div>
    </form>
  );
}

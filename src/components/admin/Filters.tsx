'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@astryxdesign/core/Button';
import {DateRangeInput, type DateRange} from '@astryxdesign/core/DateRangeInput';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {GENDER_OPTIONS, LANGUAGES, STATUS_OPTIONS} from '@/lib/constants';
import type {Filters as FilterValues} from '@/lib/queries';
import styles from './admin.module.css';

const ANY = '';

type Props = {
  initial: FilterValues;
  cityOptions: {value: string; label: string}[];
  languageOptions: string[];
};

export function Filters({initial, cityOptions, languageOptions}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q ?? '');
  const [ageMin, setAgeMin] = useState<number | undefined>(initial.ageMin);
  const [ageMax, setAgeMax] = useState<number | undefined>(initial.ageMax);
  const [gender, setGender] = useState<string>(initial.gender ?? ANY);
  const [city, setCity] = useState<string>(initial.city ?? ANY);
  const [langs, setLangs] = useState<string[]>(initial.languages);
  const [status, setStatus] = useState<string>(initial.status ?? ANY);
  const [range, setRange] = useState<DateRange | null>(
    initial.from && initial.to ? ({start: initial.from, end: initial.to} as DateRange) : null,
  );

  const langOpts = [...new Set([...LANGUAGES, ...languageOptions])].sort().map((l) => ({value: l, label: l}));

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (ageMin !== undefined && Number.isFinite(ageMin)) sp.set('ageMin', String(ageMin));
    if (ageMax !== undefined && Number.isFinite(ageMax)) sp.set('ageMax', String(ageMax));
    if (gender) sp.set('gender', gender);
    if (city) sp.set('city', city);
    if (langs.length) sp.set('lang', langs.join(','));
    if (status) sp.set('status', status);
    if (range) {
      sp.set('from', range.start);
      sp.set('to', range.end);
    }
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/admin?${qs}` : '/admin'));
  }

  function reset() {
    setQ('');
    setAgeMin(undefined);
    setAgeMax(undefined);
    setGender(ANY);
    setCity(ANY);
    setLangs([]);
    setStatus(ANY);
    setRange(null);
    startTransition(() => router.push('/admin'));
  }

  return (
    <form className={styles.filters} onSubmit={apply} role="search" aria-label="Filter profiles">
      <div className={styles.filtersWide}>
        <TextInput
          label="Search"
          type="search"
          value={q}
          onChange={setQ}
          placeholder="Name, actor ID, phone, email or Instagram"
          enterKeyHint="search"
          hasClear
          width="100%"
        />
      </div>
      <div className={styles.ageRow}>
        <NumberInput label="Age from" value={ageMin} onChange={(v) => setAgeMin(Number.isFinite(v) ? v : undefined)} isIntegerOnly min={1} max={100} width="100%" />
        <NumberInput label="Age to" value={ageMax} onChange={(v) => setAgeMax(Number.isFinite(v) ? v : undefined)} isIntegerOnly min={1} max={100} width="100%" />
      </div>
      <Selector
        label="Gender"
        options={[{value: ANY, label: 'Any'}, ...GENDER_OPTIONS]}
        value={gender}
        onChange={setGender}
        width="100%"
      />
      <Selector
        label="City"
        options={[{value: ANY, label: 'Any city'}, ...cityOptions]}
        value={city}
        onChange={setCity}
        hasSearch
        width="100%"
      />
      <Selector
        label="Status"
        options={[{value: ANY, label: 'Any status'}, ...STATUS_OPTIONS]}
        value={status}
        onChange={setStatus}
        width="100%"
      />
      <div className={styles.filtersWide}>
        <MultiSelector
          label="Languages (any of)"
          options={langOpts}
          value={langs}
          onChange={setLangs}
          hasSearch
          triggerDisplay="badges"
          maxBadges={6}
          placeholder="Any language"
          width="100%"
        />
      </div>
      <div className={styles.filtersWide}>
        <DateRangeInput label="Submitted between" value={range} onChange={setRange} />
      </div>
      <div className={styles.filterActions}>
        <Button type="submit" variant="primary" label="Apply filters" isLoading={isPending} />
        <Button variant="ghost" label="Reset" onClick={reset} />
      </div>
    </form>
  );
}

'use client';

import Link from 'next/link';
import {Table, pixel, proportional} from '@astryxdesign/core/Table';
import type {ActorStatus, Gender} from '@/db/schema';
import {GENDER_LABEL} from '@/lib/constants';
import {whatsappLink} from '@/lib/text';
import {StatusBadge} from './StatusBadge';
import styles from './admin.module.css';

export type ResultRow = {
  id: string;
  code: string;
  fullName: string;
  age: number;
  dateOfBirth: string;
  gender: Gender;
  city: string;
  languages: string[];
  phone: string;
  whatsapp: string;
  email: string;
  status: ActorStatus;
  possibleDuplicate: boolean;
  createdAt: string;
  headshotId: string | null;
};

const dateFmt = new Intl.DateTimeFormat('en-IN', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'});

function Headshot({id, name}: {id: string | null; name: string}) {
  if (!id) return <div className={styles.thumbEmpty} aria-hidden="true" />;
  // Plain <img>: the private photo route needs the admin's cookies (next/image optimizer would not send them).
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.thumb} src={`/api/photos/${id}`} alt={`Headshot of ${name}`} loading="lazy" />;
}

function NameCell({r}: {r: ResultRow}) {
  return (
    <div>
      <Link href={`/admin/actors/${r.code}`} className={styles.name}>
        {r.fullName}
      </Link>
      {r.possibleDuplicate && <span className={styles.dup} title="Same email or phone as an earlier profile">Possible duplicate</span>}
      <div className={styles.code}>{r.code}</div>
    </div>
  );
}

export function Results({rows}: {rows: ResultRow[]}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div className={styles.tableWrap}>
        <Table<ResultRow>
          data={rows}
          idKey="id"
          hasHover
          dividers="rows"
          columns={[
            {key: 'photo', header: '', width: pixel(72), renderCell: (r) => <Headshot id={r.headshotId} name={r.fullName} />},
            {key: 'name', header: 'Actor', width: proportional(2, {minWidth: 180}), renderCell: (r) => <NameCell r={r} />},
            {
              key: 'profile',
              header: 'Age / gender',
              width: proportional(1, {minWidth: 110}),
              renderCell: (r) => `${r.age} · ${GENDER_LABEL[r.gender]}`,
            },
            {key: 'city', header: 'City', width: proportional(1, {minWidth: 100}), renderCell: (r) => r.city},
            {
              key: 'languages',
              header: 'Languages',
              width: proportional(1.5, {minWidth: 140}),
              renderCell: (r) => r.languages.join(', '),
            },
            {
              key: 'contact',
              header: 'Contact',
              width: proportional(2, {minWidth: 200}),
              renderCell: (r) => (
                <div className={styles.meta}>
                  <div>
                    <a href={`tel:${r.phone}`} className={styles.name} style={{fontWeight: 400, fontSize: 14}}>
                      {r.phone}
                    </a>
                    {' · '}
                    <a href={whatsappLink(r.whatsapp)} target="_blank" rel="noreferrer" style={{color: 'var(--mad-yellow)'}}>
                      WhatsApp
                    </a>
                  </div>
                  <a href={`mailto:${r.email}`} style={{color: 'var(--mad-muted)'}}>
                    {r.email}
                  </a>
                </div>
              ),
            },
            {
              key: 'submitted',
              header: 'Submitted',
              width: proportional(1, {minWidth: 110}),
              renderCell: (r) => dateFmt.format(new Date(r.createdAt)),
            },
            {key: 'status', header: 'Status', width: proportional(1, {minWidth: 120}), renderCell: (r) => <StatusBadge status={r.status} />},
          ]}
        />
      </div>

      <ul className={styles.cards}>
        {rows.map((r) => (
          <li key={r.id} className={styles.card}>
            <Headshot id={r.headshotId} name={r.fullName} />
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <NameCell r={r} />
                <StatusBadge status={r.status} />
              </div>
              <div className={styles.meta}>
                {r.age} · {GENDER_LABEL[r.gender]} · {r.city}
              </div>
              <div className={styles.meta}>{r.languages.join(', ')}</div>
              <div className={styles.contactRow}>
                <a href={`tel:${r.phone}`}>Call</a>
                <a href={whatsappLink(r.whatsapp)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a href={`mailto:${r.email}`}>Email</a>
              </div>
              <div className={styles.meta}>Submitted {dateFmt.format(new Date(r.createdAt))}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

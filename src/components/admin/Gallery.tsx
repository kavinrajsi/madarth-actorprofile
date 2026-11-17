'use client';

import {useState} from 'react';
import {Lightbox} from '@astryxdesign/core/Lightbox';
import type {PhotoKind} from '@/db/schema';
import styles from './admin.module.css';

const KIND_LABEL: Record<PhotoKind, string> = {
  headshot: 'Headshot',
  full_length: 'Full length',
  gallery: 'Picture',
};

export function Gallery({photos, name}: {photos: {id: string; kind: PhotoKind}[]; name: string}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return <p className={styles.meta}>No photos uploaded.</p>;

  const media = photos.map((p, i) => ({
    src: `/api/photos/${p.id}`,
    alt: `${KIND_LABEL[p.kind]} ${i + 1} of ${name}`,
    caption: KIND_LABEL[p.kind],
  }));

  return (
    <>
      <div className={styles.gallery}>
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={i === 0 ? styles.lead : undefined}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            aria-label={`Open ${media[i].alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media[i].src} alt={media[i].alt} loading={i < 2 ? 'eager' : 'lazy'} />
            <span className={styles.photoLabel}>{KIND_LABEL[p.kind]}</span>
          </button>
        ))}
      </div>
      <Lightbox isOpen={open} onOpenChange={setOpen} media={media} index={index} onIndexChange={setIndex} hasZoom />
    </>
  );
}

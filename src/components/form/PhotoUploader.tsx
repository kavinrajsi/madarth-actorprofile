'use client';

import {useEffect, useRef} from 'react';
import {upload, uploadPresigned} from '@vercel/blob/client';
import {FileInput} from '@astryxdesign/core/FileInput';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';
import {Text} from '@astryxdesign/core/Text';
import type {PhotoKind} from '@/db/schema';
import {PHOTO_ACCEPT, PHOTO_MAX_BYTES, PHOTO_MIN_SHORT_SIDE} from '@/lib/constants';
import styles from './form.module.css';

/** 'token' when BLOB_READ_WRITE_TOKEN is set; 'presigned' when the store uses OIDC. */
export type UploadMode = 'token' | 'presigned';

export type UploadItem = {
  localId: string;
  /** Set for a photo already saved on the profile (edit mode). */
  id?: string;
  kind: PhotoKind;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  pathname?: string;
  contentType: string;
  size: number;
};

type Props = {
  kind: PhotoKind;
  label: string;
  description: string;
  max: number;
  isRequired?: boolean;
  getDraftId: () => string;
  uploadMode: UploadMode;
  items: UploadItem[];
  onItemsChange: (update: (prev: UploadItem[]) => UploadItem[]) => void;
  error?: string;
};

const EXT: Record<string, string> = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'};

async function checkImage(file: File): Promise<string | null> {
  if (!PHOTO_ACCEPT.includes(file.type)) return 'Use a JPG, PNG or WebP photo';
  if (file.size > PHOTO_MAX_BYTES) return 'Photo must be under 10 MB';
  try {
    const bmp = await createImageBitmap(file);
    const short = Math.min(bmp.width, bmp.height);
    bmp.close();
    if (short < PHOTO_MIN_SHORT_SIDE) {
      return `Photo is too small (${short}px). Use at least ${PHOTO_MIN_SHORT_SIDE}px on the short side.`;
    }
  } catch {
    return 'This file could not be read as an image';
  }
  return null;
}

export function PhotoUploader({kind, label, description, max, isRequired, getDraftId, uploadMode, items, onItemsChange, error}: Props) {
  const mine = items.filter((i) => i.kind === kind);
  const remaining = max - mine.length;
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const set = urls.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (localId: string, p: Partial<UploadItem>) =>
    onItemsChange((prev) => prev.map((i) => (i.localId === localId ? {...i, ...p} : i)));

  async function startUpload(file: File) {
    const localId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    urls.current.add(previewUrl);
    onItemsChange((prev) => [
      ...prev,
      {localId, kind, previewUrl, status: 'uploading', contentType: file.type, size: file.size},
    ]);

    const problem = await checkImage(file);
    if (problem) {
      patch(localId, {status: 'error', error: problem});
      return;
    }
    try {
      const ext = EXT[file.type] ?? 'jpg';
      const draftId = getDraftId();
      const send = uploadMode === 'presigned' ? uploadPresigned : upload;
      const blob = await send(`submissions/${draftId}/${kind}.${ext}`, file, {
        access: 'private',
        handleUploadUrl: '/api/upload',
        clientPayload: draftId,
        contentType: file.type,
      });
      patch(localId, {status: 'done', pathname: blob.pathname});
    } catch (e) {
      patch(localId, {
        status: 'error',
        error: e instanceof Error && e.message ? e.message : 'Upload failed. Please try again.',
      });
    }
  }

  function onFiles(files: File | File[] | null) {
    if (!files) return;
    const list = (Array.isArray(files) ? files : [files]).slice(0, Math.max(remaining, 0));
    list.forEach((f) => void startUpload(f));
  }

  function remove(localId: string) {
    onItemsChange((prev) => prev.filter((i) => i.localId !== localId));
  }

  const failed = mine.find((i) => i.status === 'error');

  return (
    <div className={styles.photoBlock} data-photo-kind={kind}>
      {remaining > 0 ? (
        <FileInput
          label={label}
          description={description}
          value={null}
          onChange={onFiles}
          accept={PHOTO_ACCEPT.join(',')}
          maxSize={PHOTO_MAX_BYTES}
          isMultiple={max > 1}
          maxFiles={remaining}
          mode="dropzone"
          isRequired={isRequired}
          isOptional={!isRequired}
          placeholder={max > 1 ? `Add up to ${remaining} photo${remaining > 1 ? 's' : ''}` : 'Add photo'}
          status={error ? {type: 'error', message: error} : undefined}
          width="100%"
        />
      ) : (
        <div>
          <Text type="label">{label}</Text>
          <Text type="supporting" display="block">
            {max > 1 ? `${max} of ${max} added` : 'Added'}. Remove a photo to replace it.
          </Text>
        </div>
      )}

      {mine.length > 0 && (
        <ul className={styles.thumbs} aria-label={`${label} uploads`}>
          {mine.map((item, idx) => (
            <li key={item.localId} className={styles.thumb} data-status={item.status}>
              <Thumbnail
                src={item.previewUrl}
                alt={`${label} ${idx + 1}`}
                label={`${label} ${idx + 1}`}
                isLoading={item.status === 'uploading'}
                onRemove={() => remove(item.localId)}
                showRemoveOn="always"
              />
              <span className={styles.thumbState}>
                {item.status === 'uploading' && 'Uploading…'}
                {item.status === 'done' && 'Uploaded'}
                {item.status === 'error' && 'Failed'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {failed?.error && (
        <p className={styles.errorText} role="alert">
          {failed.error}
        </p>
      )}
    </div>
  );
}

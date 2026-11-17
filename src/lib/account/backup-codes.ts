import {createHash, randomInt} from 'node:crypto';

/** One-time recovery codes: 10 characters (about 50 bits), shown as XXXXX-XXXXX. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
export const BACKUP_CODE_COUNT = 10;

export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  return Array.from({length: count}, () => {
    let s = '';
    for (let i = 0; i < 10; i++) s += ALPHABET[randomInt(ALPHABET.length)];
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}

/** Uppercase, strip spaces/dashes; null if it can't be a backup code. */
export function normalizeBackupCode(input: string): string | null {
  const s = input.toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z0-9]{10}$/.test(s) ? s : null;
}

export function hashBackupCode(normalized: string): string {
  return createHash('sha256').update(`madarth-backup-v1:${normalized}`).digest('hex');
}

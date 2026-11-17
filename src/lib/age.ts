const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's date in India (YYYY-MM-DD). */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata'}).format(now);
}

/** True for a real calendar date in YYYY-MM-DD form (rejects 2025-02-30). */
export function isIsoDate(v: string): boolean {
  const m = ISO.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Whole years between a date of birth and `today` (both YYYY-MM-DD). Null if dob is missing or invalid. */
export function ageFromDob(dob: string | null | undefined, today: string = todayIST()): number | null {
  if (!dob || !isIsoDate(dob) || !isIsoDate(today)) return null;
  const [by, bm, bd] = dob.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

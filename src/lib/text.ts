/** Trim and collapse whitespace. */
export function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** "  chennai " -> "chennai"; used for filtering. */
export function normalizeCity(s: string): string {
  return clean(s).toLowerCase();
}

/** "chennai" -> "Chennai", "new delhi" -> "New Delhi". */
export function titleCase(s: string): string {
  return clean(s)
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Keep digits and a leading +. */
export function normalizePhone(s: string): string {
  const t = s.trim();
  const plus = t.startsWith('+') ? '+' : '';
  return plus + t.replace(/\D/g, '');
}

export function instagramHandle(s: string): string {
  return s
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '');
}

export function whatsappLink(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  // Assume India when a bare 10-digit number is given.
  if (digits.length === 10) digits = '91' + digits;
  return `https://wa.me/${digits}`;
}

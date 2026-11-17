/**
 * Lightweight password strength estimate for the meter (0 = too weak … 4 = strong).
 * Advisory only: the server still enforces the minimum rules in password.ts.
 */
export type Strength = {score: 0 | 1 | 2 | 3 | 4; label: string; tips: string[]};

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'admin123', 'welcome1', 'letmein1', 'abc12345', 'madarth123', 'casting123',
]);

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

function hasSequence(pw: string): boolean {
  const s = pw.toLowerCase();
  for (let i = 0; i < s.length - 3; i++) {
    const a = s.charCodeAt(i);
    if (s.charCodeAt(i + 1) === a + 1 && s.charCodeAt(i + 2) === a + 2 && s.charCodeAt(i + 3) === a + 3) return true;
  }
  return false;
}

export function passwordStrength(pw: string): Strength {
  if (!pw) return {score: 0, label: LABELS[0], tips: []};
  const tips: string[] = [];
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;

  let points = 0;
  if (pw.length >= 8) points += 1;
  if (pw.length >= 12) points += 1;
  if (pw.length >= 16) points += 1;
  points += Math.max(0, kinds - 1); // 0..3 for variety

  if (COMMON.has(pw.toLowerCase())) points = 0;
  if (/(.)\1{2,}/.test(pw)) points -= 1; // aaa, 111
  if (hasSequence(pw)) points -= 1; // abcd, 1234

  if (/(.)\1{2,}/.test(pw) || hasSequence(pw)) tips.push('Avoid repeats and sequences like 1234');
  if (pw.length < 12) tips.push('Use 12 or more characters');
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) tips.push('Mix upper and lower case');
  if (!/\d/.test(pw)) tips.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(pw)) tips.push('Add a symbol');

  const score = (pw.length < 8 ? 0 : Math.max(0, Math.min(4, Math.round((points / 6) * 4)))) as Strength['score'];
  return {score, label: LABELS[score], tips: score >= 4 ? [] : tips.slice(0, 2)};
}

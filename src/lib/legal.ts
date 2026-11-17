/**
 * Facts used across the policy pages. Change them here, not in the pages.
 * Fill in `address` before going live.
 */
export const LEGAL = {
  companyName: 'Madarth',
  address: '[REGISTERED ADDRESS]',
  privacyEmail: 'productions@madarth.com',
  retention: '2 years',
  withdrawalDays: 30,
  lastUpdated: '17 November 2026',
  jurisdiction: 'Chennai, Tamil Nadu, India',
} as const;

export const POLICY_LINKS = [
  {href: '/privacy', label: 'Privacy Policy'},
  {href: '/terms', label: 'Terms of Use'},
  {href: '/photo-consent', label: 'Photo & Consent Policy'},
  {href: '/cookies', label: 'Cookie Policy'},
] as const;

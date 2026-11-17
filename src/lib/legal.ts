/**
 * Facts used across the policy pages. Change them here, not in the pages.
 */
export const LEGAL = {
  /** Brand name used in running text. */
  companyName: 'Madarth',
  /** Registered company that owns the Madarth brand (the data fiduciary). */
  legalEntity: 'PIXEL BOY MEDIA PUBLICITIES PRIVATE LIMITED',
  address: 'Madarth 4, Alamelu Manga Puram Rd, Saradapuram, Mylapore, Chennai, Tamil Nadu 600004',
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

/** Help pages for actors, shown in the footer before the policies. */
export const HELP_LINKS = [{href: '/faq', label: 'FAQ'}] as const;

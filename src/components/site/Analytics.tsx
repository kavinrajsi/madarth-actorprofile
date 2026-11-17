'use client';

import {useEffect} from 'react';

/** Live site only: tracking never runs on madarth-actorprofile.vercel.app, previews or localhost. */
export const LIVE_HOST = 'casting.madarth.com';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TF863TB4';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Loads Google Tag Manager (which loads GA4 and Microsoft Clarity) on the live domain.
 * Added from the client so the host check uses the real address the visitor opened.
 */
export function Analytics() {
  useEffect(() => {
    if (window.location.hostname !== LIVE_HOST) return;
    if (document.getElementById('gtm-script')) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    const s = document.createElement('script');
    s.id = 'gtm-script';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(s);
  }, []);
  return null;
}

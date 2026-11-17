'use client';

import Link from 'next/link';
import {LinkProvider} from '@astryxdesign/core/Link';
import {Theme} from '@astryxdesign/core/theme';
import {madarthTheme} from '@/themes/madarth/madarth';

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <Theme theme={madarthTheme} mode="dark">
      <LinkProvider component={Link}>{children}</LinkProvider>
    </Theme>
  );
}

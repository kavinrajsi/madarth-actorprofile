'use client';

import Link from 'next/link';
import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import {LinkProvider} from '@astryxdesign/core/Link';
import {Theme} from '@astryxdesign/core/theme';
import {madarthTheme} from '@/themes/madarth/madarth';

// Label markers: "Full name *" instead of "Full name ∙ Required"; optional fields read "(optional)".
const LABEL_MARKS = {
  '@astryx.field.required': '*',
  '@astryx.fileInput.required': '*',
  '@astryx.field.optional': '(optional)',
};
const overrides = {en: LABEL_MARKS, 'en-IN': LABEL_MARKS};

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <InternationalizationProvider locale="en-IN" overrides={overrides}>
      <Theme theme={madarthTheme} mode="dark">
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </InternationalizationProvider>
  );
}

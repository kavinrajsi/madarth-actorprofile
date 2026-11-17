import type {Metadata, Viewport} from 'next';
import {Anek_Tamil} from 'next/font/google';
import {Providers} from './providers';
import './globals.css';

const anekTamil = Anek_Tamil({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'tamil'],
  variable: '--font-anek-tamil',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {default: 'Actor Registration | Madarth', template: '%s | Madarth Casting'},
  description: 'Submit your actor profile, photographs and experience to the Madarth casting team.',
};

export const viewport: Viewport = {
  themeColor: '#111111',
  colorScheme: 'dark',
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" className={anekTamil.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

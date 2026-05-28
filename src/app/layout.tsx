import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { BottomNav } from '@/components/BottomNav';

// Editorial serif for display headings; humanist sans for body.
// next/font self-hosts these at build time (no runtime request to Google).
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz', 'SOFT'],
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Keep In Touch',
  description: 'Quiet nudges toward the people who matter.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Keep In Touch' },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf9f3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

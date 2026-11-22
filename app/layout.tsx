import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, DM_Sans } from 'next/font/google';
import './globals.css';
import { ContentProvider } from '@/components/content-provider';
import { readSiteContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

const display = Barlow_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800', '900'] });
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });

export const viewport: Viewport = {
  themeColor: '#E63926',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Munchy — Smash Burgers, French Tacos & Snacks · Casablanca',
  description: 'Fresh off the griddle in Maârif, Casablanca. Crisp smash burgers, loaded French tacos, and house sauces delivered straight from our kitchen.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Munchy',
  },
  openGraph: {
    title: 'Munchy — Direct Casablanca Snack Kitchen',
    description: 'Smash burgers, French tacos & loaded snacks. Fresh in Maârif, delivered across Casablanca.',
    type: 'website',
    locale: 'fr_MA',
    siteName: 'Munchy Casablanca',
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content } = await readSiteContent();
  const siteUrl = process.env.SITE_URL;
  const restaurantJsonLd = siteUrl && process.env.BUSINESS_VERIFIED === '1' ? {
    '@context': 'https://schema.org', '@type': 'FastFoodRestaurant',
    name: content.branding.name, url: siteUrl, telephone: content.contact.phone,
    address: content.contact.address, hasMenu: new URL('/menu', siteUrl).href,
    servesCuisine: ['Burgers', 'French tacos', 'Moroccan snacks'],
  } : null;
  return (
    <html lang="en">
      <head>
        {restaurantJsonLd && <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c") }}
        />}
      </head>
      <body
        className={`${display.variable} ${body.className}`}
        style={{
          "--paprika": content.branding.accent,
          "--cream": content.branding.canvas,
          "--saffron": content.branding.highlight,
        } as CSSProperties}
      >
        <ContentProvider content={content}>{children}</ContentProvider>
      </body>
    </html>
  );
}

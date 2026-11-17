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

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FastFoodRestaurant',
  name: 'Munchy Casablanca',
  image: 'https://munchy.ma/images/smash-burger.webp',
  telephone: '+212600000000',
  url: 'https://munchy.ma',
  priceRange: '20 DH - 70 DH',
  servesCuisine: ['Smash Burgers', 'French Tacos', 'Fast Food', 'Moroccan Snacks'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12 Rue des Épices, Maârif',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 33.5878,
    longitude: -7.6358,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '12:00',
      closes: '23:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday', 'Sunday'],
      opens: '12:00',
      closes: '00:00',
    },
  ],
  hasMenu: 'https://munchy.ma/menu',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content } = await readSiteContent();
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
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

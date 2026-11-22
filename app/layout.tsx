import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, DM_Sans, Cormorant_Garamond, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import './experience.css';
import 'lenis/dist/lenis.css';
import ExperienceProvider from '@/components/experience-provider';
import { ContentProvider } from '@/components/content-provider';
import { readSiteContent } from '@/lib/site-content';
import { openingHoursSchema } from '@/lib/business-hours';
import { publicDeliveryConfig } from '@/lib/hospitality';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const display = Barlow_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800', '900'] });
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });

const editorial = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-editorial', weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], display: 'swap' });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic', weight: ['400', '500', '600', '700'], display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#E63926',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Munchy — Smash Burgers, French Tacos & Snacks · Casablanca',
  description: 'Fresh off the griddle in Maârif, Casablanca. Crisp smash burgers, loaded French tacos, and house sauces delivered straight from our kitchen.',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  twitter: { card: 'summary_large_image', title: 'Munchy — Casablanca, made to order', images: ['/images/smash-burger.webp'] },
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
    images: [{ url: '/images/smash-burger.webp', width: 1200, height: 997, alt: 'Munchy double smash burger' }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content } = await readSiteContent();
  const savedLocale = (await cookies()).get('munchy_locale')?.value;
  const initialLocale = savedLocale === 'ar' || savedLocale === 'fr' ? savedLocale : 'en';
  const siteUrl = process.env.SITE_URL;
  const kitchen = publicDeliveryConfig();
  const prices = content.products.filter(p => p.available !== false).map(p => p.price);
  const restaurantJsonLd = siteUrl && process.env.BUSINESS_VERIFIED === '1' ? {
    '@context': 'https://schema.org', '@type': 'FastFoodRestaurant',
    name: content.branding.name, url: siteUrl, telephone: content.contact.phone,
    address: { '@type': 'PostalAddress', streetAddress: content.contact.address, addressLocality: 'Casablanca', addressCountry: 'MA' }, hasMenu: new URL('/menu', siteUrl).href,
    servesCuisine: ['Burgers', 'French tacos', 'Moroccan snacks'],
    openingHoursSpecification: openingHoursSchema(content.contact.hours),
    priceRange: `${Math.min(...prices)}–${Math.max(...prices)} MAD`,
    image: new URL(content.presentation.heroImage || '/images/smash-burger.webp', siteUrl).href,
    ...(kitchen ? { geo: { '@type': 'GeoCoordinates', latitude: kitchen.lat, longitude: kitchen.lng } } : {}),
  } : null;
  return (
    <html lang={initialLocale} dir={initialLocale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        {restaurantJsonLd && <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c") }}
        />}
      </head>
      <body
        className={`${display.variable} ${body.variable} ${editorial.variable} ${arabic.variable} ${body.className}`}
        style={{
          "--paprika": content.branding.accent,
          "--ember": content.branding.accent,
          "--paper": content.branding.canvas,
          "--gold": content.branding.highlight,
          "--cream": content.branding.canvas,
          "--saffron": content.branding.highlight,
        } as CSSProperties}
      >
        <ContentProvider content={content} initialLocale={initialLocale}><ExperienceProvider>{children}</ExperienceProvider></ContentProvider>
      </body>
    </html>
  );
}

import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { Barlow_Condensed, DM_Sans } from 'next/font/google';
import './globals.css';
import { ContentProvider } from '@/components/content-provider';
import { readSiteContent } from '@/lib/site-content';
export const dynamic = 'force-dynamic';

const display = Barlow_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800', '900'] });
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Munchy — Big cravings, zero detours',
  description: 'Smash burgers, French tacos and loaded snacks. Fresh from our kitchen to your door in Casablanca.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { content } = await readSiteContent();
  return <html lang="en"><body className={`${display.variable} ${body.className}`} style={{ "--paprika": content.branding.accent, "--cream": content.branding.canvas, "--saffron": content.branding.highlight } as CSSProperties}><ContentProvider content={content}>{children}</ContentProvider></body></html>;
}

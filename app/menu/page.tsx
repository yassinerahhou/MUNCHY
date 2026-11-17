import type { Metadata } from 'next';
import { PageShell } from '@/components/site-chrome';
import MenuClient from '@/components/menu-client';

export const metadata: Metadata = { title: 'Order the Menu', description: 'Browse smash burgers, French tacos, loaded fries, sauces and cold drinks from the Munchy kitchen.' };

export default function MenuPage() {
  return <PageShell><MenuClient /></PageShell>;
}

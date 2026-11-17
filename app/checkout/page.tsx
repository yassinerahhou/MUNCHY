import type { Metadata } from 'next';
import CheckoutPage from '@/components/checkout-page';
import { PageShell } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

export default function CheckoutRoute() { return <PageShell><CheckoutPage /></PageShell>; }

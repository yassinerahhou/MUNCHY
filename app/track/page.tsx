import type { Metadata } from 'next';
import TrackingClient from '@/components/tracking-client';
import { PageShell } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Track an Order', description: 'Check the status of your Munchy delivery or pickup order.' };

export default function TrackPage() { return <PageShell><TrackingClient /></PageShell>; }

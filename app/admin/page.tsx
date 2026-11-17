import type { Metadata } from 'next';
import AdminClient from '@/components/admin-client';
import { PageShell } from '@/components/site-chrome';

export const metadata: Metadata = { title: 'Kitchen Desk', robots: { index: false, follow: false } };

export default function AdminPage() { return <PageShell><AdminClient /></PageShell>; }

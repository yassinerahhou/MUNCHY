import { PageShell } from '@/components/site-chrome';
import BoxBuilder from '@/components/box-builder';
export const metadata = { title: 'Build your box — Munchy' };
export default function BuildPage() { return <PageShell><main className="hospitality-page" id="main-content"><BoxBuilder /></main></PageShell>; }

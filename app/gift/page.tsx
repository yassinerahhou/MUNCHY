import { PageShell } from '@/components/site-chrome';
import HospitalityForm from '@/components/hospitality-form';
export const metadata = { title: 'The Gift Studio — Munchy', robots: { index: false, follow: true } };
export default async function GiftPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) { const { ref } = await searchParams; return <PageShell><main className="hospitality-page">{ref && /^MH-[A-F0-9]{16}$/.test(ref) && <div className="gift-reference"><b>{ref}</b><p>Gift request reference only. This is not proof of payment or an active gift balance. Contact the kitchen to verify activation.</p></div>}<HospitalityForm kind="gift" /></main></PageShell>; }

import { PageShell } from '@/components/site-chrome';
import HospitalityForm from '@/components/hospitality-form';
export const metadata = { title: 'Request a table — Munchy' };
export default function ReservePage() { return <PageShell><main className="hospitality-page"><HospitalityForm kind="reservation" /></main></PageShell>; }

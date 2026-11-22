import { PageShell } from '@/components/site-chrome';
import HospitalityForm from '@/components/hospitality-form';
export const metadata = { title: 'Your Munchy moment — Feedback', robots: { index: false, follow: true } };
export default function ReviewPage() { return <PageShell><main className="hospitality-page"><HospitalityForm kind="feedback" /></main></PageShell>; }

'use client';

import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { FormEvent, useState, useEffect } from 'react';
import { en } from '@/locales/en';
import { useSiteContent } from '@/components/content-provider';

export default function CateringForm() {
  const en = useSiteContent();
  const [initialGuests, setInitialGuests] = useState(12);
  const [initialNote, setInitialNote] = useState('');
  useEffect(() => { const query = new URLSearchParams(location.search); const guests = Number(query.get('guests')); const budget = Number(query.get('budget')); if (guests >= 5 && guests <= 100) setInitialGuests(Math.floor(guests)); if ([45, 65, 85].includes(budget)) setInitialNote(`Indicative budget: ${budget} DH per guest. Please confirm a tailored quote.`); }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    const rawPhone = String(payload.phone || '').replace(/[\s-]/g, '');
    payload.phone = rawPhone.startsWith('+212') ? rawPhone : `+212${rawPhone}`;
    try {
      const response = await fetch('/api/catering', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.catering.error);
      setSent(true); formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : en.catering.error); }
    finally { setLoading(false); }
  }
  return <div className="catering-form-wrap">
    {sent ? <div className="catering-success"><span><Check size={21} /></span><h3>{en.catering.success}</h3><p>{en.catering.replyLine}</p><a href={`https://wa.me/${en.contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{en.catering.contactWhatsApp}<ArrowRight size={14} /></a></div> : <form className="catering-form" onSubmit={submit}>
      <label className="catering-trap" aria-hidden="true">Website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      <div className="catering-form-grid"><label>{en.catering.formName}<input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder={en.ui.namePlaceholder} /></label><label>{en.catering.formPhone}<div className="phone-field"><span>+212</span><input name="phone" autoComplete="tel-national" inputMode="tel" required placeholder={en.ui.phonePlaceholder} pattern="[67][0-9]{8}" /></div></label><label>{en.catering.formEmail}<input name="email" type="email" autoComplete="email" placeholder="you@example.ma" /></label><label>{en.catering.formEvent}<select name="eventType" required><option value="">{en.catering.chooseEvent}</option>{en.catering.eventTypes.map((type, index) => <option key={type} value={['Office lunch', 'Birthday', 'Private event', 'Other'][index]}>{type}</option>)}</select></label><label>{en.catering.formDate}<input name="eventDate" type="date" min={new Date().toISOString().slice(0, 10)} /></label><label>{en.catering.formGuests}<input name="guests" type="number" min="5" max="300" key={initialGuests} defaultValue={initialGuests} required /></label></div>
      <label>{en.catering.formNote}<textarea name="note" rows={3} key={initialNote} defaultValue={initialNote} maxLength={1000} placeholder={en.catering.notePlaceholder} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-red" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={16} />{en.catering.sending}</> : <>{en.catering.submit}<ArrowRight size={16} /></>}</button><p className="form-privacy">{en.catering.formPrivacy}</p>
    </form>}
  </div>;
}

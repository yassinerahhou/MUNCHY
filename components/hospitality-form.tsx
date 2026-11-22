'use client';
import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, Check, Star } from 'lucide-react';
import { useSiteContent } from '@/components/content-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
import { casaDate, timeSlots, reservationZones, occasions, type RequestKind } from '@/lib/hospitality';
import { useLocale } from '@/lib/locale';
import { track } from '@/lib/analytics';

const labels = {
  en: { Indoor: 'Indoor', Terrace: 'Terrace', 'VIP lounge': 'VIP lounge', 'Just because': 'Just because', Birthday: 'Birthday', Anniversary: 'Anniversary', Business: 'Business' },
  fr: { Indoor: 'Intérieur', Terrace: 'Terrasse', 'VIP lounge': 'Salon VIP', 'Just because': 'Pour le plaisir', Birthday: 'Anniversaire', Anniversary: 'Anniversaire de couple', Business: 'Professionnel' },
  ar: { Indoor: 'الداخل', Terrace: 'التراس', 'VIP lounge': 'صالون خاص', 'Just because': 'غير هكاك', Birthday: 'عيد ميلاد', Anniversary: 'ذكرى سنوية', Business: 'عمل' },
};
export default function HospitalityForm({ kind }: { kind: RequestKind }) {
  const t = useExperienceCopy(), content = useSiteContent(), { locale } = useLocale();
  const [date, setDate] = useState(''), [amount, setAmount] = useState(200), [recipient, setRecipient] = useState(''), [message, setMessage] = useState(''), [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [reference, setReference] = useState(''), [qr, setQr] = useState('');
  const slots = timeSlots(date, content.contact.hours);
  const title = kind === 'reservation' ? t.reserveTitle : kind === 'gift' ? t.gift : kind === 'club' ? t.clubTitle : t.reviewForm;
  useEffect(() => {
    if (!reference || kind !== 'gift') return;
    let active = true;
    const url = new URL('/gift', location.origin); url.searchParams.set('ref', reference);
    QRCode.toDataURL(url.href, { width: 160, margin: 1, color: { dark: '#171913', light: '#ffffff' } }).then(value => { if (active) setQr(value); }).catch(() => setQr(''));
    return () => { active = false; };
  }, [reference, kind]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/hospitality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, kind, amount, recipient, message, rating, consent: form.get('consent') === 'on', guests: Number(form.get('guests')) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Please try again.');
      setReference(result.reference); track('request_saved', { kind });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const maximum = new Date(); maximum.setDate(maximum.getDate() + 89);
  const google = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;
  const googleUrl = google && /^https:\/\/(g\.page|maps\.app\.goo\.gl|www\.google\.com|search\.google\.com)\//.test(google) ? google : null;
  return <div className={`hospitality-form form-${kind}`}><p className="exp-eyebrow">{kind === 'gift' ? t.giftLabel : content.branding.name + ' / CASABLANCA'}</p><h2>{title}</h2>
    {reference ? <div className="request-ticket" role="status"><Check size={32} /><h3>{kind === 'feedback' ? t.feedbackSent : t.requestSaved}</h3><small>{t.reference}</small><b>{reference}</b>{kind === 'gift' && <div className="gift-preview"><span>{content.branding.name} / GIFT REQUEST</span><strong>{amount} <small>DH</small></strong><p>{recipient}</p><p>{message}</p>{qr && <img src={qr} width={160} height={160} alt="QR code for this gift request reference" />}<small>{t.giftNote}</small></div>}<p>{kind === 'club' ? t.clubBody : kind === 'feedback' ? t.reviewsBody : t.requestNote}</p>{kind === 'feedback' && googleUrl && <a className="exp-button" href={googleUrl} target="_blank" rel="noopener noreferrer">{t.publicReview}<ArrowRight size={15} /></a>}</div> : <form onSubmit={submit}>
      {kind === 'reservation' && <><p>{t.reserveBody}</p><div className="form-grid"><label className="exp-field">{t.guests}<select name="guests" defaultValue="2">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><label className="exp-field">{t.date}<input type="date" name="date" value={date} onChange={e => setDate(e.target.value)} min={casaDate(tomorrow)} max={casaDate(maximum)} required /></label><label className="exp-field">{t.time}<select name="time" key={date} required defaultValue=""><option value="" disabled>—</option>{slots.map(time => <option key={time}>{time}</option>)}</select></label><label className="exp-field">{t.zone}<select name="zone">{reservationZones.map(zone => <option key={zone} value={zone}>{labels[locale][zone]}</option>)}</select></label></div><label className="exp-field">{t.occasion}<select name="occasion">{occasions.map(occasion => <option key={occasion} value={occasion}>{labels[locale][occasion]}</option>)}</select></label><small>{t.reserveNote}</small></>}
      {kind === 'gift' && <><p>{t.giftBody}</p><div className="gift-preview"><span>{content.branding.name} / CASABLANCA</span><strong>{amount} <small>DH</small></strong><p>{recipient || t.recipient}</p><p>{message || 'Bon appétit, with love.'}</p><small>{t.giftNote}</small></div><fieldset className="gift-amounts"><legend>{t.amount}</legend>{[100, 200, 300, 500].map(value => <button type="button" key={value} aria-pressed={value === amount} onClick={() => setAmount(value)}>{value} DH</button>)}</fieldset><label className="exp-field">{t.recipient}<input required minLength={2} maxLength={80} value={recipient} onChange={e => setRecipient(e.target.value)} /></label><label className="exp-field">{t.message}<textarea value={message} maxLength={240} rows={2} onChange={e => setMessage(e.target.value)} /></label></>}
      {kind === 'feedback' && <><fieldset className="rating-picker"><legend>{t.rating}</legend>{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} aria-label={`${value}/5`} aria-pressed={rating === value} onClick={() => setRating(value)}><Star fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</fieldset><label className="exp-field">{t.feedback}<textarea value={message} onChange={e => setMessage(e.target.value)} minLength={5} maxLength={1500} rows={4} required /></label>{googleUrl && <a className="public-review-link" href={googleUrl} target="_blank" rel="noopener noreferrer">{t.publicReview} ↗</a>}</>}
      {kind === 'club' && <p>{t.clubBody}</p>}
      <div className="form-grid"><label className="exp-field">{t.name}<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label><label className="exp-field">{t.phone}<input name="phone" type="tel" autoComplete="tel" placeholder="06 00 00 00 00" required /></label></div><label className="exp-field">{t.email}<input name="email" type="email" autoComplete="email" maxLength={160} /></label><div className="honeypot" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {kind === 'club' && <label className="exp-consent"><input type="checkbox" name="consent" required />{t.consent}</label>}{error && <p className="exp-error" role="alert">{error}</p>}<button disabled={busy} className="exp-button" type="submit">{busy ? t.sending : kind === 'gift' ? t.giftAction : kind === 'club' ? t.club : t.send}<ArrowRight size={17} /></button>
    </form>}
  </div>;
}

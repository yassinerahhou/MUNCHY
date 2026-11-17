'use client';

import { ArrowRight, Check, CircleDot, Clock3, MapPin, PackageCheck, Search, Truck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { en } from '@/locales/en';
import { useSiteContent } from '@/components/content-provider';

type TrackedOrder = { code: string; status: keyof typeof en.tracking.statuses; fulfillment: 'delivery' | 'pickup'; total: number; createdAt: string; items: Array<{ name: string; quantity: number }> };
const milestones: Array<TrackedOrder['status']> = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'];

export default function TrackingClient() {
  const en = useSiteContent();
  const [code, setCode] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const prefill = new URLSearchParams(window.location.search).get('code'); if (prefill) setCode(prefill.toUpperCase()); }, []);
  async function lookup(event?: FormEvent) {
    event?.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/orders/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, phoneLast4 }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.tracking.error);
      setOrder(result);
    } catch (cause) { setOrder(null); setError(cause instanceof Error ? cause.message : en.tracking.error); }
    finally { setBusy(false); }
  }
  const activeIndex = order ? milestones.indexOf(order.status) : -1;
  return <main className="tracking-page">
    <div className="tracking-head"><p className="section-label"><span>—</span> {en.tracking.eyebrow}</p><h1>{en.tracking.title[0]}<br /><em>{en.tracking.title[1]}</em></h1><p>{en.tracking.body}</p></div>
    <div className="tracking-grid"><form className="tracking-form" onSubmit={lookup}><label>{en.tracking.code}<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoCapitalize="characters" placeholder="MC-ABC123" required maxLength={9} /></label><label>{en.tracking.phoneLast4}<input value={phoneLast4} onChange={(event) => setPhoneLast4(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" placeholder="1234" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-red" disabled={busy}>{busy ? en.ui.loading : en.tracking.submit}<Search size={15} /></button><p>{en.tracking.privacy}</p></form>
      {order ? <section className="tracking-result"><div className="tracking-result-top"><div><span>{en.ui.orderCodeLabel}</span><b>{order.code}</b></div><span className={`order-status status-${order.status}`}>{en.tracking.statuses[order.status]}</span></div><div className="tracking-timeline">{milestones.filter((status) => !(order.fulfillment === 'pickup' && status === 'out_for_delivery')).map((status, index) => { const completed = status !== 'cancelled' && index <= activeIndex; const current = status === order.status; return <div className={completed ? 'timeline-step completed' : 'timeline-step'} key={status}><span className="timeline-icon">{completed ? <Check size={14} /> : index === 2 ? <Clock3 size={14} /> : index >= 4 ? <Truck size={14} /> : <CircleDot size={14} />}</span><div><b>{en.tracking.statuses[status]}</b>{current && <small>{en.tracking.currentStep}</small>}</div></div>; })}</div><div className="tracking-order-lines"><span>{en.tracking.yourOrder}</span>{order.items.map((item, index) => <p key={`${item.name}-${index}`}><b>{String(item.quantity).padStart(2, '0')}</b> {item.name}</p>)}<div><span>{en.cart.total}</span><b>{order.total} DH</b></div></div><button className="track-refresh" onClick={() => lookup()}><PackageCheck size={15} />{en.tracking.refresh}</button></section> : <aside className="tracking-aside"><div className="tracking-aside-mark"><MapPin size={19} /></div><span>{en.tracking.asideKicker}</span><h2>{en.tracking.asideTitle}</h2><p>{en.tracking.asideBody}</p><a href="/menu">{en.ui.viewMenu}<ArrowRight size={14} /></a></aside>}
    </div>
  </main>;
}

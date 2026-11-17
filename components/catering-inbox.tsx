'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Phone, Mail, Users } from 'lucide-react';
type Lead = { id: string; name: string; phone: string; email: string; eventType: string; eventDate: string; guests: number; note: string; createdAt: string };
export default function CateringInbox() {
  const [leads, setLeads] = useState<Lead[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); setError(''); try { const response = await fetch('/api/admin/catering', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setLeads(data.leads); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Inbox unavailable.'); } finally { setBusy(false); } }
  useEffect(() => { load(); }, []);
  return <section className="catering-inbox"><div className="cms-toolbar"><div><p className="section-label">GROUP ORDERS & EVENTS</p><h2>Catering inbox</h2><p>{leads.length} enquiries in view</p></div><button className="cms-subtle" disabled={busy} onClick={load}><RefreshCw size={15} />{busy ? 'Refreshing…' : 'Refresh'}</button></div>{error && <p className="form-error" role="alert">{error}</p>}{!busy && !leads.length && <p className="cms-empty">Catering requests will appear here. Customers can submit details from the catering page.</p>}<div className="catering-leads">{leads.map((lead) => <article key={lead.id}><div><span>{lead.eventType}</span><h3>{lead.name}</h3><small>{new Date(lead.createdAt).toLocaleString()}</small></div><div className="lead-contact"><a href={`tel:${lead.phone}`}><Phone size={14} />{lead.phone}</a>{lead.email && <a href={`mailto:${lead.email}`}><Mail size={14} />{lead.email}</a>}</div><p><Users size={15} />{lead.guests} guests · {lead.eventDate || 'Date to confirm'}</p>{lead.note && <p className="lead-note">{lead.note}</p>}</article>)}</div></section>;
}

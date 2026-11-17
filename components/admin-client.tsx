'use client';

import { ArrowDownRight, ArrowRight, CircleCheck, ClipboardList, Clock3, LogOut, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { en } from '@/locales/en';
import ContentManager from '@/components/content-manager';
import CateringInbox from '@/components/catering-inbox';
import { useSiteContent } from '@/components/content-provider';

type Status = 'received' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
type AdminOrder = { code: string; name: string; phone: string; address: string; locationUrl?: string; items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>; fulfillment: 'delivery' | 'pickup'; total: number; subtotal: number; deliveryFee: number; status: Status; createdAt: string; changeFor: string };
const statuses: Status[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

export default function AdminClient() {
  const en = useSiteContent();
  const [tab, setTab] = useState<'orders' | 'storefront' | 'catering'>('orders');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState('');
  const [busyCode, setBusyCode] = useState('');
  const [filter, setFilter] = useState<'open' | 'all' | 'completed'>('open');
  const openOrders = useMemo(() => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)), [orders]);
  const displayed = filter === 'open' ? openOrders : filter === 'completed' ? orders.filter((order) => order.status === 'completed') : orders;

  async function loadOrders() {
    const response = await fetch('/api/admin/orders', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || en.admin.error);
    setOrders(result.orders);
  }
  useEffect(() => {
    fetch('/api/admin/session').then((response) => response.json()).then(async ({ authenticated: isAuthed }) => {
      setAuthenticated(isAuthed);
      if (isAuthed) await loadOrders();
    }).catch(() => setError(en.admin.error)).finally(() => setLoading(false));
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.admin.error);
      setAuthenticated(true); setPassword(''); await loadOrders();
    } catch (cause) { setError(cause instanceof Error ? cause.message : en.admin.error); }
    finally { setLoading(false); }
  }
  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' }); setAuthenticated(false); setOrders([]);
  }
  async function changeStatus(code: string, status: Status) {
    setBusyCode(code); setError('');
    try {
      const response = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.admin.error);
      setOrders((current) => current.map((order) => order.code === code ? { ...order, status } : order));
    } catch (cause) { setError(cause instanceof Error ? cause.message : en.admin.error); }
    finally { setBusyCode(''); }
  }

  return <main className="admin-page">
    <header className="admin-heading"><div><p className="section-label"><span>—</span> {en.admin.kicker}</p><h1>{en.admin.title}<span>.</span></h1></div>{authenticated && <button className="admin-logout" onClick={signOut}><LogOut size={15} />{en.admin.signOut}</button>}</header>
    {loading ? <div className="admin-loading"><RefreshCw size={18} />{en.ui.loading}</div> : !authenticated ? <section className="admin-login"><div className="admin-lock"><ShieldCheck size={23} /></div><h2>{en.admin.signIn}</h2><p>{en.admin.loginCopy}</p><form onSubmit={signIn}><label>{en.admin.password}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-red" disabled={loading}>{en.admin.signIn}<ArrowRight size={15} /></button></form>{process.env.NODE_ENV === 'development' && <p className="admin-demo-hint">{en.admin.demoHint}</p>}</section> : <>
      <div className="admin-workspace-tabs"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders & service</button><button className={tab === "storefront" ? "active" : ""} onClick={() => setTab("storefront")}>Products, pages & settings</button><button className={tab === "catering" ? "active" : ""} onClick={() => setTab("catering")}>Catering inbox</button></div>
      <div hidden={tab !== "catering"}><CateringInbox /></div><div hidden={tab !== "storefront"}><ContentManager /></div><div hidden={tab !== "orders"}>
      <div className="admin-stats"><div><span>{en.admin.openTickets}</span><b>{openOrders.length}</b><small><Clock3 size={13} /> {en.admin.needsAttention}</small></div><div><span>{en.admin.todaysOrders}</span><b>{orders.length}</b><small><ClipboardList size={13} /> {en.admin.recentWindow}</small></div><div><span>{en.admin.todaysSales}</span><b>{orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0)} DH</b><small><TrendingUp size={13} /> {en.admin.codSalesNote}</small></div><div><span>{en.admin.completed}</span><b>{orders.filter((order) => order.status === 'completed').length}</b><small><CircleCheck size={13} /> {en.admin.doneLabel}</small></div></div>
      <section className="admin-orders"><div className="admin-orders-heading"><div><p className="section-label"><span>01</span> {en.admin.liveDesk}</p><h2>{en.admin.allOrders}</h2></div><div className="admin-order-filters">{(['open', 'all', 'completed'] as const).map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{en.admin.filters[item]}</button>)}<button className="admin-refresh" onClick={() => { setError(''); loadOrders().catch((cause) => setError(cause instanceof Error ? cause.message : en.admin.error)); }} aria-label={en.admin.refresh}><RefreshCw size={15} /></button></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {displayed.length ? <div className="admin-order-list">{displayed.map((order) => <article className="admin-order-card" key={order.code}><div className="admin-order-top"><div><span className="admin-order-code">{order.code}</span><span className={`order-status status-${order.status}`}>{en.tracking.statuses[order.status]}</span></div><time>{new Date(order.createdAt).toLocaleString('en-MA', { dateStyle: 'medium', timeStyle: 'short' })}</time></div><div className="admin-order-main"><div><h3>{order.name}</h3><a href={`tel:${order.phone}`}>{order.phone}</a><p>{order.fulfillment === 'delivery' ? order.address : en.admin.pickup}</p>{order.locationUrl && <a className="admin-map-link" href={order.locationUrl} target="_blank" rel="noopener noreferrer">{en.admin.openMap}<ArrowDownRight size={13} /></a>}</div><div className="admin-order-items">{order.items.map((item, index) => <p key={`${item.id}-${index}`}><b>{String(item.quantity).padStart(2, '0')}</b>{item.name}<small>{item.unitPrice * item.quantity} DH</small></p>)}</div><div className="admin-order-totals"><span>{en.admin.subtotal} <b>{order.subtotal} DH</b></span><span>{en.admin.delivery} <b>{order.deliveryFee ? `${order.deliveryFee} DH` : 'FREE'}</b></span><strong>{en.admin.total}<b>{order.total} DH</b></strong><small>{en.admin.cash}: {order.changeFor === 'exact' ? en.admin.exactChange : `${order.changeFor} DH`}</small></div></div><div className="admin-order-bottom"><span>{order.fulfillment === 'pickup' ? en.admin.pickup : en.admin.deliveryOrder}</span><label>{en.admin.status}<select value={order.status} disabled={busyCode === order.code} onChange={(event) => changeStatus(order.code, event.target.value as Status)}>{statuses.map((status) => <option key={status} value={status}>{en.tracking.statuses[status]}</option>)}</select></label></div></article>)}</div> : <div className="admin-empty"><ClipboardList size={23} /><h3>{en.admin.noOrders}</h3><p>{en.admin.emptyHint}</p><a href="/menu">{en.admin.visitMenu}<ArrowRight size={13} /></a></div>}
      </section></div>
    </>}
  </main>;
}

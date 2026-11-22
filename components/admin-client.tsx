'use client';
import { csvCell } from '@/lib/csv';

import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  BellOff,
  CircleCheck,
  ClipboardList,
  Clock3,
  Download,
  LogOut,
  MessageCircle,
  Printer,
  Radio,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteContent } from '@/components/content-provider';
import ContentManager from '@/components/content-manager';
import CateringInbox from '@/components/catering-inbox';
import HospitalityInbox from '@/components/hospitality-inbox';

type Status = 'received' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
type AdminOrder = {
  code: string;
  name: string;
  phone: string;
  address: string;
  locationUrl?: string;
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>;
  fulfillment: 'delivery' | 'pickup';
  total: number;
  subtotal: number;
  deliveryFee: number;
  status: Status;
  createdAt: string;
  changeFor: string;
};

const statuses: Status[] = ['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0.3, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.55);
  } catch {
    // Autoplay restrictions
  }
}

export default function AdminClient() {
  const en = useSiteContent();
  const [tab, setTab] = useState<'orders' | 'storefront' | 'catering' | 'hospitality'>('orders');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState('');
  const [busyCode, setBusyCode] = useState('');
  const [filter, setFilter] = useState<'open' | 'all' | 'completed'>('open');

  // Operations controls: Auto-refresh, Sound alerts & Print ticket
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printOrder, setPrintOrder] = useState<AdminOrder | null>(null);
  const knownCodes = useRef<Set<string>>(new Set());

  const openOrders = useMemo(() => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)), [orders]);
  const displayed = filter === 'open' ? openOrders : filter === 'completed' ? orders.filter((order) => order.status === 'completed') : orders;

  async function loadOrders(isPolling = false) {
    const response = await fetch('/api/admin/orders', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || en.admin.error);

    const fetched: AdminOrder[] = result.orders;
    if (isPolling && soundEnabled && knownCodes.current.size > 0) {
      const hasNew = fetched.some((order) => !knownCodes.current.has(order.code) && order.status === 'received');
      if (hasNew) {
        playOrderChime();
      }
    }
    knownCodes.current = new Set(fetched.map((order) => order.code));
    setOrders(fetched);
  }

  useEffect(() => {
    fetch('/api/admin/session')
      .then((response) => response.json())
      .then(async ({ authenticated: isAuthed }) => {
        setAuthenticated(isAuthed);
        if (isAuthed) await loadOrders(false);
      })
      .catch(() => setError(en.admin.error))
      .finally(() => setLoading(false));
  }, []);

  // 20-second automatic polling for live orders
  useEffect(() => {
    if (!authenticated || !autoRefresh) return;
    const timer = setInterval(() => {
      loadOrders(true).catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [authenticated, autoRefresh, soundEnabled]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.admin.error);
      setAuthenticated(true);
      setPassword('');
      await loadOrders(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : en.admin.error);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setOrders([]);
  }

  async function changeStatus(code: string, status: Status) {
    setBusyCode(code); setError('');
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, status })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.admin.error);
      setOrders((current) => current.map((order) => order.code === code ? { ...order, status } : order));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : en.admin.error);
    } finally {
      setBusyCode('');
    }
  }

  function triggerPrint(order: AdminOrder) {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  }

  function exportCSV() {
    if (orders.length === 0) return;
    const headers = ['Order Code', 'Date', 'Customer Name', 'Phone', 'Fulfillment', 'Address', 'Subtotal (DH)', 'Delivery (DH)', 'Total (DH)', 'Payment', 'Change For', 'Status'];
    const rows = orders.map((o) => [
      o.code,
      new Date(o.createdAt).toLocaleString('fr-MA'),
      o.name,
      o.phone,
      o.fulfillment,
      o.address || '',
      o.subtotal,
      o.deliveryFee,
      o.total,
      'Cash on delivery',
      o.changeFor,
      o.status
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `munchy-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="admin-page">
    <header className="admin-heading">
      <div>
        <p className="section-label"><span>—</span> {en.admin.kicker}</p>
        <h1>{en.admin.title}<span>.</span></h1>
      </div>
      {authenticated && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="admin-tool-btn" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF'}>
            {soundEnabled ? <Bell size={15} color="#46a878" /> : <BellOff size={15} color="#999" />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
          <button className="admin-tool-btn" onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Auto-refresh active (20s)' : 'Auto-refresh paused'}>
            <Radio size={15} color={autoRefresh ? '#46a878' : '#999'} />
            <span>{autoRefresh ? 'Live (20s)' : 'Paused'}</span>
          </button>
          <button className="admin-tool-btn" onClick={exportCSV} title="Export orders to CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="admin-logout" onClick={signOut}><LogOut size={15} />{en.admin.signOut}</button>
        </div>
      )}
    </header>

    {loading ? <div className="admin-loading"><RefreshCw size={18} />{en.ui.loading}</div> : !authenticated ? (
      <section className="admin-login">
        <div className="admin-lock"><ShieldCheck size={23} /></div>
        <h2>{en.admin.signIn}</h2>
        <p>{en.admin.loginCopy}</p>
        <form onSubmit={signIn}>
          <label>{en.admin.password}
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-red" disabled={loading}>{en.admin.signIn}<ArrowRight size={15} /></button>
        </form>
        {process.env.NODE_ENV === 'development' && <p className="admin-demo-hint">{en.admin.demoHint}</p>}
      </section>
    ) : <>
      <div className="admin-workspace-tabs">
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders & service</button>
        <button className={tab === "storefront" ? "active" : ""} onClick={() => setTab("storefront")}>Products, pages & settings</button>
        <button className={tab === "catering" ? "active" : ""} onClick={() => setTab("catering")}>Catering inbox</button>
        <button className={tab === 'hospitality' ? 'active' : ''} onClick={() => setTab('hospitality')}>Tables, gifts & feedback</button>
      </div>

      <div hidden={tab !== "catering"}><CateringInbox /></div>
      {tab === 'hospitality' && <HospitalityInbox />}
      <div hidden={tab !== "storefront"}><ContentManager /></div>

      <div hidden={tab !== "orders"}>
        <div className="admin-stats">
          <div><span>{en.admin.openTickets}</span><b>{openOrders.length}</b><small><Clock3 size={13} /> {en.admin.needsAttention}</small></div>
          <div><span>{en.admin.todaysOrders}</span><b>{orders.length}</b><small><ClipboardList size={13} /> {en.admin.recentWindow}</small></div>
          <div><span>{en.admin.todaysSales}</span><b>{orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0)} DH</b><small><TrendingUp size={13} /> {en.admin.codSalesNote}</small></div>
          <div><span>{en.admin.completed}</span><b>{orders.filter((order) => order.status === 'completed').length}</b><small><CircleCheck size={13} /> {en.admin.doneLabel}</small></div>
        </div>

        <section className="admin-orders">
          <div className="admin-orders-heading">
            <div><p className="section-label"><span>01</span> {en.admin.liveDesk}</p><h2>{en.admin.allOrders}</h2></div>
            <div className="admin-order-filters">
              {(['open', 'all', 'completed'] as const).map((item) => (
                <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{en.admin.filters[item]}</button>
              ))}
              <button className="admin-refresh" onClick={() => { setError(''); loadOrders(false).catch((cause) => setError(cause instanceof Error ? cause.message : en.admin.error)); }} aria-label={en.admin.refresh}>
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          {displayed.length ? (
            <div className="admin-order-list">
              {displayed.map((order) => (
                <article className="admin-order-card" key={order.code}>
                  <div className="admin-order-top">
                    <div>
                      <span className="admin-order-code">{order.code}</span>
                      <span className={`order-status status-${order.status}`}>{en.tracking.statuses[order.status]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <time>{new Date(order.createdAt).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                      <button type="button" className="ticket-print-btn" disabled={busyCode === order.code} onClick={async () => { setBusyCode(order.code); setError(''); try { const response = await fetch('/api/admin/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: order.code }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Webhook failed'); } finally { setBusyCode(''); } }} title="Send or retry configured POS webhook">POS ↗</button>
                      <button className="ticket-print-btn" type="button" onClick={() => triggerPrint(order)} title="Print Thermal KOT Ticket">
                        <Printer size={14} /> Print
                      </button>
                    </div>
                  </div>

                  <div className="admin-order-main">
                    <div>
                      <h3>{order.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' }}>
                        <a href={`tel:${order.phone}`}>{order.phone}</a>
                        <a
                          className="whatsapp-contact-link"
                          href={`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${order.name}, c'est Munchy Casablanca concernant votre commande ${order.code}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Message customer on WhatsApp"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      </div>
                      <p>{order.fulfillment === 'delivery' ? order.address : en.admin.pickup}</p>
                      {order.locationUrl && (
                        <a className="admin-map-link" href={order.locationUrl} target="_blank" rel="noopener noreferrer">
                          {en.admin.openMap}<ArrowDownRight size={13} />
                        </a>
                      )}
                    </div>

                    <div className="admin-order-items">
                      {order.items.map((item, index) => (
                        <p key={`${item.id}-${index}`}>
                          <b>{String(item.quantity).padStart(2, '0')}</b>{item.name}
                          <small>{item.unitPrice * item.quantity} DH</small>
                        </p>
                      ))}
                    </div>

                    <div className="admin-order-totals">
                      <span>{en.admin.subtotal} <b>{order.subtotal} DH</b></span>
                      <span>{en.admin.delivery} <b>{order.deliveryFee ? `${order.deliveryFee} DH` : 'FREE'}</b></span>
                      <strong>{en.admin.total}<b>{order.total} DH</b></strong>
                      <small>{en.admin.cash}: {order.changeFor === 'exact' ? en.admin.exactChange : `${order.changeFor} DH`}</small>
                    </div>
                  </div>

                  <div className="admin-order-bottom">
                    <span>{order.fulfillment === 'pickup' ? en.admin.pickup : en.admin.deliveryOrder}</span>
                    <label>{en.admin.status}
                      <select value={order.status} disabled={busyCode === order.code} onChange={(event) => changeStatus(order.code, event.target.value as Status)}>
                        {statuses.map((status) => <option key={status} value={status}>{en.tracking.statuses[status]}</option>)}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <ClipboardList size={23} />
              <h3>{en.admin.noOrders}</h3>
              <p>{en.admin.emptyHint}</p>
              <a href="/menu">{en.admin.visitMenu}<ArrowRight size={13} /></a>
            </div>
          )}
        </section>
      </div>
    </>}

    {/* Printable Thermal Receipt (Visible ONLY when printing) */}
    {printOrder && (
      <div id="thermal-receipt" className="thermal-receipt-container">
        <div className="thermal-header">
          <h2>*** MUNCHY CASABLANCA ***</h2>
          <p>12 Rue des Épices, Maârif</p>
          <p>KITCHEN ORDER TICKET (KOT)</p>
          <hr />
        </div>
        <div className="thermal-meta">
          <p><strong>ORDER: {printOrder.code}</strong></p>
          <p>Date: {new Date(printOrder.createdAt).toLocaleString('fr-MA')}</p>
          <p>Type: <strong>{printOrder.fulfillment.toUpperCase()}</strong></p>
          <p>Customer: {printOrder.name}</p>
          <p>Phone: {printOrder.phone}</p>
          {printOrder.fulfillment === 'delivery' && (
            <p>Address: {printOrder.address}</p>
          )}
          <hr />
        </div>
        <div className="thermal-items">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>QTY</th>
                <th style={{ textAlign: 'left' }}>ITEM</th>
                <th style={{ textAlign: 'right' }}>DH</th>
              </tr>
            </thead>
            <tbody>
              {printOrder.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold' }}>{item.quantity}x</td>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
        </div>
        <div className="thermal-totals">
          <p>Subtotal: {printOrder.subtotal} DH</p>
          <p>Delivery: {printOrder.deliveryFee} DH</p>
          <h3>TOTAL: {printOrder.total} DH</h3>
          <p>Payment: CASH ON DELIVERY</p>
          <p>Change: {printOrder.changeFor === 'exact' ? 'Exact change' : `Change for ${printOrder.changeFor} DH`}</p>
        </div>
        <div className="thermal-footer">
          <hr />
          <p>*** MERCI / CHOKRAN ***</p>
        </div>
      </div>
    )}
  </main>;
}

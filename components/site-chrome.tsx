'use client';

import { ArrowRight, Clock3, ShoppingBag, Sparkles, MapPin, Phone, Instagram } from 'lucide-react';
import { useEffect, useState } from 'react';
import { en } from '@/locales/en';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';

export function SiteHeader() {
  const en = useSiteContent();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const { items, points } = useCart();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  useEffect(() => setReady(true), []);
  return <>
    <div className="ticker"><div className="ticker-runner">{Array.from({ length: 3 }, (_, index) => <span key={index}>{en.announcement}<b>—</b></span>)}</div></div>
    <header className="nav-wrap">
      <a className="brand" href="/" aria-label={en.ui.homeLabel}><span className="brand-name">{en.branding.name}<span className="logo-period">.</span></span></a>
      <nav className={open ? 'main-nav open' : 'main-nav'} aria-label={en.ui.mainNavigation}>
        <a href="/menu" onClick={() => setOpen(false)}>{en.nav.menu}</a>
        <a href="/story" onClick={() => setOpen(false)}>{en.nav.story}</a>
        <a href="/catering" onClick={() => setOpen(false)}>{en.nav.catering}</a>
        <a href="/track" onClick={() => setOpen(false)}>{en.nav.track}</a><a href="/help" onClick={() => setOpen(false)}>Delivery & help</a>
      </nav>
      <div className="nav-actions">
        <span className="points"><Sparkles size={14} /> {ready ? points : 0} pts</span>
        <a className="nav-order" href="/menu#cart" onClick={(event) => { if (window.location.pathname === "/menu") { event.preventDefault(); window.dispatchEvent(new Event("munchy:cart")); } }}>{en.nav.order}<span className="cart-nav-icon"><ShoppingBag size={17} />{ready && count > 0 && <i>{count}</i>}</span></a>
      </div>
      <button className="menu-toggle" aria-label={en.ui.navToggle} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span></span><span></span></button>
    </header>
  </>;
}

export function SiteFooter() {
  const en = useSiteContent();
  return <footer className="site-footer">
    <div className="site-footer-main">
      <div><a className="brand footer-brand" href="/" aria-label={en.ui.homeLabel}><span className="brand-name">{en.branding.name}<span className="logo-period">.</span></span></a><p>{en.footer.line}<br /><small>{en.footer.small}</small></p><a className="footer-order-link" href="/menu">Order straight from the kitchen <ArrowRight size={15} /></a></div>
      <div className="footer-column"><span>{en.ui.footerVisit}</span><p><MapPin size={14} />{en.contact.address}</p><a href={`tel:${en.contact.phone.replace(/[\s-]/g, '')}`}><Phone size={14} />{en.contact.phone}</a><a href={`mailto:${en.contact.email}`}>{en.contact.email}</a></div>
      <div className="footer-column"><span>{en.ui.footerHours}</span><p><Clock3 size={14} />{en.contact.hours[0]} · {en.contact.hours[1]}</p><p><Clock3 size={14} />{en.contact.hours[2]} · {en.contact.hours[3]}</p><p>{en.ui.footerCasablanca}</p></div>
      <div className="footer-column"><span>{en.ui.footerExplore}</span><a href="/menu">{en.nav.menu}</a><a href="/story">{en.nav.story}</a><a href="/catering">{en.nav.catering}</a><a href="/track">{en.nav.track}</a><a href="/help">Delivery & help</a><a href="/admin">{en.ui.adminLink}</a></div>
    </div>
    <div className="site-footer-bottom"><span>{en.ui.footerCity}</span><span>{en.ui.footerDirect}</span><span>{en.ui.copyright}</span><a href="/help">Contact the kitchen <ArrowRight size={14} /></a></div>
  </footer>;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}

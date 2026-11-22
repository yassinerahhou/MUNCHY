'use client';
import EditorialHeader from '@/components/editorial-header';

import { ArrowRight, Clock3, MapPin, Phone } from 'lucide-react';
import { useSiteContent } from '@/components/content-provider';

export function SiteHeader() { return <EditorialHeader />; }

export function SiteFooter() {
  const en = useSiteContent();
  return <footer className="site-footer">
    <div className="site-footer-main">
      <div><a className="brand footer-brand" href="/" aria-label={en.ui.homeLabel}><span className="brand-name">{en.branding.name}<span className="logo-period">.</span></span></a><p>{en.footer.line}<br /><small>{en.footer.small}</small></p><a className="footer-order-link" href="/menu">Order straight from the kitchen <ArrowRight size={15} /></a></div>
      <div className="footer-column"><span>{en.ui.footerVisit}</span><p><MapPin size={14} />{en.contact.address}</p><a href={`tel:${en.contact.phone.replace(/[\s-]/g, '')}`}><Phone size={14} />{en.contact.phone}</a><a href={`mailto:${en.contact.email}`}>{en.contact.email}</a></div>
      <div className="footer-column"><span>{en.ui.footerHours}</span><p><Clock3 size={14} />{en.contact.hours[0]} · {en.contact.hours[1]}</p><p><Clock3 size={14} />{en.contact.hours[2]} · {en.contact.hours[3]}</p><p>{en.ui.footerCasablanca}</p></div>
      <div className="footer-column"><span>{en.ui.footerExplore}</span><a href="/menu">{en.nav.menu}</a><a href="/story">{en.nav.story}</a><a href="/catering">{en.nav.catering}</a><a href="/track">{en.nav.track}</a><a href="/help">Delivery & help</a></div>
    </div>
    <div className="site-footer-bottom"><span>{en.ui.footerCity}</span><span>{en.ui.footerDirect}</span><span>{en.ui.copyright}</span><a href="/help">Contact the kitchen <ArrowRight size={14} /></a></div>
    <div className="agency-credit">Digital Experience crafted by <a href={process.env.NEXT_PUBLIC_AGENCY_URL || '/agency'}>Elite Digital House</a></div>
  </footer>;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}

'use client';
import { useEffect, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useSpring } from 'framer-motion';
import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react';
import { useSiteContent } from '@/components/content-provider';
import { useLocale } from '@/lib/locale';
import { useCart } from '@/lib/cart';
import { useExperience } from '@/components/experience-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
export default function EditorialHeader() {
  const content = useSiteContent(), t = useExperienceCopy(), { locale, setLocale } = useLocale(), { openCart, openForm } = useExperience();
  const items = useCart(s => s.items), count = items.reduce((sum, item) => sum + item.quantity, 0);
  const [ready, setReady] = useState(false), [hidden, setHidden] = useState(false), [menu, setMenu] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  useEffect(() => { setReady(true); }, []);
  useMotionValueEvent(scrollY, 'change', value => { const previous = scrollY.getPrevious() || 0; if (Math.abs(value - previous) > 3) setHidden(value > previous && value > 140); });
  useEffect(() => { if (!menu) return; const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [menu]);
  return <><a className="skip-link" href="#main-content">Skip to content</a><motion.div className="reading-progress" style={{ scaleX: progress }} />
    <header onFocusCapture={() => setHidden(false)} className={`editorial-header ${hidden && !menu ? 'header-hidden' : ''}`}>
      <a className="editorial-brand" href="/" aria-label={content.ui.homeLabel}>{content.branding.name.toLowerCase()}<span>®</span><small>CASABLANCA</small></a>
      <nav className={menu ? 'editorial-nav is-open' : 'editorial-nav'} aria-label={content.ui.mainNavigation}><a href="/menu" onClick={() => setMenu(false)}>{t.menu}</a><a href="/story" onClick={() => setMenu(false)}>{t.story}</a><a href="/catering" onClick={() => setMenu(false)}>{t.events}</a><a href="/gift" onClick={() => setMenu(false)}>{t.giftLabel}</a></nav>
      <div className="editorial-actions"><div className="editorial-languages" aria-label="Language">{(['en', 'fr', 'ar'] as const).map(lang => <button type="button" key={lang} lang={lang} aria-pressed={lang === locale} onClick={() => setLocale(lang)}>{lang.toUpperCase()}</button>)}</div><button className="header-reserve" data-analytics="reserve_click" onClick={() => openForm('reservation')}>{t.reserve}<ArrowUpRight size={15} /></button><motion.button className="header-bag" aria-label={`${t.bag} (${ready ? count : 0})`} onClick={openCart} key={ready ? count : 0} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: .25 }}><ShoppingBag size={18} /><span>{ready ? count : 0}</span></motion.button><button className="editorial-toggle" aria-expanded={menu} aria-label={menu ? t.close : t.menu} onClick={() => setMenu(v => !v)}>{menu ? <X /> : <Menu />}</button></div>
    </header><div className="header-spacer" /><nav className="quick-jump" aria-label="Quick navigation"><a href="/menu">{t.menu}</a><a href="/story">{t.story}</a><a href="/catering">{t.events}</a><button onClick={() => openForm('reservation')}>{t.reserve}<ArrowUpRight size={13} /></button></nav>
    <div className="thumb-bar"><button onClick={() => openForm('reservation')}>{t.reserve}</button><button onClick={openCart}><ShoppingBag size={17} />{t.bag}<b>{ready ? count : 0}</b></button></div>
  </>;
}

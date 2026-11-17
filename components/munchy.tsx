'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Crosshair, Flame, Heart, Minus, Plus, ShoppingBag, Sparkles, UserCheck, X } from 'lucide-react';
import Image from 'next/image';
import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react';
import { en } from '@/locales/en';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';
import { useLocale } from '@/lib/locale';
import { getBusinessStatus } from '@/lib/business-hours';
import RestaurantExperience from '@/components/restaurant-experience';
import { SiteFooter } from '@/components/site-chrome';

type Product = import('@/lib/content-types').Product;

const formatDh = (n: number) => `${n} DH`;

const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .65, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
);

export default function Munchy() {
  const en = useSiteContent();
  const { locale, setLocale } = useLocale();
  const categories = en.menu.categories;
  const featuredProduct = en.products.find((product) => product.available !== false) || en.products[0];
  const { items, points, addItem, changeQuantity, removeItem, earnPoints, clear } = useCart();
  const [category, setCategory] = useState<string>(categories[0]);
  const [cartOpen, setCartOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [budget, setBudget] = useState(50);
  const [hunger, setHunger] = useState('Hungry');
  const [matchAdded, setMatchAdded] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [builderChoice, setBuilderChoice] = useState<Record<string, { name: string; price: number } | null>>({ base: null, protein: null, sauce: null, side: null });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [gps, setGps] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [orderCode, setOrderCode] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [receiptPoints, setReceiptPoints] = useState(0);
  const [receipt, setReceipt] = useState(false);

  // Customer details auto-fill
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [savedFound, setSavedFound] = useState(false);
  const [businessStatus, setBusinessStatus] = useState({ isOpen: true, badgeText: 'OPEN NOW', timingText: 'At your door in ~25 min' });

  useEffect(() => {
    setBusinessStatus(getBusinessStatus());
    try {
      const saved = localStorage.getItem('munchy_customer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.address) setCustomerAddress(parsed.address);
        setSavedFound(true);
      }
    } catch {}
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = fulfillment === 'pickup' || subtotal === 0 || subtotal >= en.contact.freeDeliveryFrom ? 0 : en.contact.deliveryFee;
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleProducts = category === categories[0] ? en.products.filter((item) => item.available !== false) : en.products.filter((item) => item.available !== false && item.category.toLowerCase() === category.toLowerCase());
  const steps = [
    { key: 'base', title: 'Pick your base', note: 'The beginning of a very good idea.' },
    { key: 'protein', title: 'Choose your protein', note: 'Go crispy, beefy, or properly spiced.' },
    { key: 'sauce', title: 'Make it saucy', note: 'A little extra is usually the right call.' },
    { key: 'side', title: 'Add a side or sip', note: 'Round out the good stuff.' },
  ] as const;
  const builderTotal = Object.values(builderChoice).reduce((sum, item) => sum + (item?.price || 0), 0);
  const recommendation: Product = useMemo(() => {
    const available = en.products.filter((product) => product.available !== false && product.price <= budget);
    const sorted = [...available].sort((a, b) => hunger === 'Light snack' ? a.price - b.price : b.price - a.price);
    return sorted[0] || en.products.filter((product) => product.available !== false).sort((a, b) => a.price - b.price)[0] || en.products[0];
  }, [budget, hunger, en.products]);

  const openMatcher = () => { setMatcherOpen(true); setMatchAdded(false); };
  const addProduct = (product: Product) => { addItem({ id: product.id, name: product.name, price: product.price, image: product.image }); };
  const addUpsell = (upsell: typeof en.upsells[number]) => addItem({ ...upsell });
  const addBuild = () => {
    const selections = Object.values(builderChoice).filter((choice): choice is { name: string; price: number } => !!choice);
    const productName = selections.map((choice) => choice.name).join(' · ');
    const customization = Object.entries(builderChoice).flatMap(([key, choice]) => choice ? [{ key, option: choice.name }] : []);
    addItem({ id: `custom-box-${crypto.randomUUID()}`, name: `Your Munchy Box · ${productName}`, price: builderTotal, image: '/images/loaded-fries.webp', customization });
    setBuilderOpen(false); setCartOpen(true); setBuilderStep(0); setBuilderChoice({ base: null, protein: null, sauce: null, side: null });
  };
  const shareLocation = () => {
    if (!navigator.geolocation) { setCheckoutError(en.ui.locationUnavailable); return; }
    setGpsBusy(true); setCheckoutError('');
    navigator.geolocation.getCurrentPosition((position) => {
      setGps(`https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`); setGpsBusy(false);
    }, () => { setCheckoutError(en.ui.locationFailed); setGpsBusy(false); }, { enableHighAccuracy: true, timeout: 9000 });
  };
  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setCheckoutError(''); setCheckoutSubmitting(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || customerName).trim();
    const rawPhone = String(form.get('phone') || customerPhone).replace(/[\s-]/g, '');
    const phone = rawPhone.startsWith('+212') ? rawPhone : `+212${rawPhone}`;
    const address = String(form.get('address') || customerAddress).trim();
    if (!name || (fulfillment === 'delivery' && !address) || !/^\+212[67]\d{8}$/.test(phone)) { setCheckoutError(en.ui.checkoutError); setCheckoutSubmitting(false); return; }
    const changeFor = String(form.get('change') || 'Exact change').match(/100|200/)?.[0] || 'exact';
    try {
      const response = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, locationUrl: gps, fulfillment, changeFor, items: items.map(({ id, productId, selections, quantity, customization }) => ({ id, productId, selections, quantity, customization })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.ui.orderSubmitError);
      try {
        localStorage.setItem('munchy_customer', JSON.stringify({ name, phone: phone.replace('+212', ''), address }));
      } catch {}
      setOrderCode(result.orderCode); setWhatsappUrl(result.whatsappUrl); setReceiptTotal(result.total); setReceiptPoints(result.pointsEarned); earnPoints(result.pointsEarned);
      setReceipt(true); setCheckoutOpen(false);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : en.ui.orderSubmitError);
    } finally { setCheckoutSubmitting(false); }
  };

  return <main>
    <div className="ticker"><div className="ticker-runner">{Array.from({ length: 4 }, (_, index) => <span key={index}>{en.announcement}<b>—</b></span>)}</div></div>
    <header className="nav-wrap">
      <a className="brand" href="/#top" aria-label={en.ui.homeLabel}><span className="brand-name">{en.branding.name}<span className="logo-period">.</span></span></a>
      <nav className={mobileMenu ? 'main-nav open' : 'main-nav'} aria-label={en.ui.mainNavigation}>
        <a href="/menu" onClick={() => setMobileMenu(false)}>{en.nav.menu}</a>
        <a href="/story" onClick={() => setMobileMenu(false)}>{en.nav.story}</a>
        <a href="/catering" onClick={() => setMobileMenu(false)}>{en.nav.catering}</a>
        <a href="/track" onClick={() => setMobileMenu(false)}>{en.nav.track}</a><a href="/help" onClick={() => setMobileMenu(false)}>Help</a>
        <button onClick={() => { setBuilderOpen(true); setMobileMenu(false); }}>{en.nav.build}</button>
        <div className="mobile-locale-picker">
          {(['en', 'fr', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={locale === lang ? 'active' : ''}
              onClick={() => { setLocale(lang); setMobileMenu(false); }}
            >
              {lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'عربي'}
            </button>
          ))}
        </div>
      </nav>
      <div className="nav-actions">
        <div className="lang-switcher" role="group" aria-label="Language">
          {(['en', 'fr', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={locale === lang ? 'lang-btn active' : 'lang-btn'}
              onClick={() => setLocale(lang)}
            >
              {lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'عربي'}
            </button>
          ))}
        </div>
        <span className="points"><Sparkles size={14} /> {points} pts</span>
        <button className="nav-order" onClick={() => setCartOpen(true)}>{en.nav.order}<span className="cart-nav-icon"><ShoppingBag size={17} />{quantity > 0 && <i>{quantity}</i>}</span></button>
      </div>
      <button className="menu-toggle" aria-label={en.ui.navToggle} onClick={() => setMobileMenu((value) => !value)}><span></span><span></span></button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot"></span>{en.hero.eyebrow}</div>
        <div className="hero-title-wrap"><h1>{en.hero.title[0]}<br /><span>{en.hero.title[1]}</span></h1></div>
        <p className="hero-intro">{en.hero.body}</p>
        <div className="hero-buttons"><a className="button button-red" href="/menu">{en.hero.primary}<ArrowRight size={17} /></a><button className="button button-light" onClick={() => setBuilderOpen(true)}>{en.hero.secondary}<ArrowDownRight size={17} /></button></div>
        <div className="hero-meta"><span className="status-pill"><i></i>{businessStatus.badgeText}</span><span><Clock3 size={15} />{businessStatus.timingText}</span><span className="hero-dot">·</span><span>{en.ui.city}</span></div>
      </div>
      <div className="hero-visual">
        <div className="hero-image-frame"><Image src={en.presentation.heroImage || featuredProduct.image} alt={featuredProduct.name} fill priority sizes="(max-width: 700px) 88vw, 42vw" quality={82} /><span className="photo-caption">{en.ui.heroPhotoCaption.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</span></div>
        <div className="hero-sticker"><Flame size={18} fill="currentColor" /><span>{en.hero.stamp.split('\n').map((line) => <b key={line}>{line}</b>)}</span></div>
        <div className="hero-price-note"><span>{featuredProduct.name.split(' ').map((line, index) => <Fragment key={`${line}-${index}`}>{line}<br /></Fragment>)}</span><b>{featuredProduct.price} <small>DH</small></b><span className="note-line"></span></div>
        <div className="hero-side-label">{en.ui.heroSideLabel}</div><div className="hero-dish-card"><span>THE BURGER THAT STARTS THE CONVERSATION</span><h2>{featuredProduct.name}</h2><p>{featuredProduct.description}</p><a href={`/menu/${featuredProduct.id}`}>See ingredients & build your meal <ArrowRight size={15} /></a></div>
      </div>
      <div className="hero-index"><span>01</span><i></i><span>06</span></div>
    </section>

    <div className="service-strip">{en.ui.servicePoints.map((point, index) => <Fragment key={point}><span>{point}</span>{index < en.ui.servicePoints.length - 1 && <i>—</i>}</Fragment>)}</div>

    <section className="menu-section section-pad" id="menu">
      <div className="section-top"><Reveal><p className="section-label"><span>01</span> {en.menu.label}</p><h2>{en.menu.title.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h2></Reveal><Reveal delay={.1}><p className="section-desc">{en.menu.body}</p><button className="text-link" onClick={openMatcher}>{en.ui.menuHelp} <ArrowRight size={16} /></button></Reveal></div>
      <div className="menu-toolbar"><div className="category-list" role="tablist" aria-label={en.ui.categoryFilter}>{categories.map((item) => <button role="tab" aria-selected={category === item} key={item} className={category === item ? 'category active' : 'category'} onClick={() => { setCategory(item); requestAnimationFrame(() => document.getElementById('home-menu-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>{item}</button>)}</div><span className="menu-counter">{en.ui.productCount.replace('{count}', String(visibleProducts.length).padStart(2, '0'))}</span></div>
      <motion.div className="product-grid" id="home-menu-results" layout>{visibleProducts.slice(0, 6).map((product, index) => <motion.article className="product-card" key={product.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .35, delay: index * .04 }}>
        <div className={`product-image ${product.tone}`}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 92vw, 30vw" quality={78} /><span className="product-tag">{product.tag}</span><button aria-label={`Add ${product.name}`} className="quick-add" onClick={() => addProduct(product)}><Plus size={20} /></button></div>
        <div className="product-info"><div><span className="product-category">{product.category}</span><h3><a href={`/menu/${product.id}`}>{product.name}</a></h3></div><b className="product-price">{formatDh(product.price)}</b></div><p className="product-description">{product.description}</p><button className="add-line" onClick={() => addProduct(product)}>{en.ui.addToOrder} <Plus size={15} /></button>
      </motion.article>)}</motion.div>
      <div className="menu-bottom"><a className="button button-light" href="/menu">Explore all {en.products.length} items <ArrowRight size={16} /></a><button className="text-link" onClick={() => setCartOpen(true)}>{en.ui.viewOrder} <ArrowRight size={15} /></button></div>
    </section>

    {en.presentation.showMatcher && <section id="matcher" className="matcher-section section-pad">
      <div className="matcher-deco">M</div><div className="matcher-content"><div className="section-label light-label"><span>02</span> {en.matcher.label}</div><div className="matcher-grid"><div><h2>{en.matcher.title}</h2><p>{en.matcher.body}</p></div><div className="matcher-controls"><div className="selector-group"><span>{en.ui.budgetQuestion}</span><div>{[30, 50, 80].map((amount) => <button className={budget === amount ? 'choice selected' : 'choice'} onClick={() => setBudget(amount)} key={amount}>{amount === 80 ? '80+ DH' : `${amount} DH`}</button>)}</div></div><div className="selector-group"><span>{en.ui.hungerQuestion}</span><div>{en.matcher.hunger.map((level) => <button className={hunger === level ? 'choice selected' : 'choice'} onClick={() => setHunger(level)} key={level}>{level}</button>)}</div></div><button className="button button-saffron matcher-button" onClick={openMatcher}>{en.matcher.button}<ArrowRight size={17} /></button></div></div><div className="matcher-foot"><span>{en.ui.matcherFooterLeft}</span><span>{en.ui.matcherFooterRight} <ArrowRight size={13} /></span></div></div>
    </section>}

    {en.presentation.showCombo && <section className="combo-section section-pad">
      <div className="combo-photo"><Image src={en.presentation.comboImage} alt={en.ui.comboPhotoAlt} fill sizes="(max-width: 700px) 88vw, 42vw" quality={78} /><div className="photo-stamp">{en.ui.comboSticker.map((line) => <Fragment key={line}>{line}<br /></Fragment>)}</div><span className="combo-photo-caption">{en.ui.comboPhotoCaption}</span></div>
      <div className="combo-copy"><p className="section-label"><span>03</span> {en.ui.comboEyebrow}</p><h2>{en.ui.comboTitle[0]}<br /><em>{en.ui.comboTitle[1]}</em></h2><p>{en.ui.comboBody}</p><ul>{en.ui.comboBenefits.map((benefit) => <li key={benefit}><Check size={16} />{benefit}</li>)}</ul><button className="button button-red" onClick={() => setBuilderOpen(true)}>{en.ui.buildBox}<ArrowRight size={17} /></button><span className="combo-asterisk">—</span></div>
    </section>}

    {en.presentation.showClub && <section className="club-section section-pad" id="club"><div className="club-card"><div className="club-left"><p className="section-label"><span>04</span> {en.club.eyebrow}</p><h2>{en.club.title}<span>.</span></h2><p>{en.club.body}</p><button className="button button-light" onClick={() => setCartOpen(true)}>{en.club.cta}<ArrowRight size={16} /></button></div><div className="club-right"><div className="club-ring"><span>—</span><b>10</b><small>{en.ui.clubPoints}</small></div><div className="club-sticker">{en.ui.clubSticker[0]}<br /><strong>=</strong><br />{en.ui.clubSticker[1]}</div><p>{en.club.reward}</p></div><div className="club-index">{en.ui.clubIndex}</div></div></section>}

    <RestaurantExperience /><SiteFooter />

    {quantity > 0 && <button className="mobile-cart" onClick={() => setCartOpen(true)}><span><ShoppingBag size={17} /> View your order</span><b>{formatDh(subtotal + delivery)} <ArrowRight size={16} /></b></button>}

    <AnimatePresence>{cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><motion.aside className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} aria-label="Your order" aria-modal="true" role="dialog">
      <div className="drawer-head"><div><span className="drawer-kicker">{en.cart.kicker}</span><h2>{en.cart.title}<span>.</span></h2></div><button className="close-button" onClick={() => setCartOpen(false)} aria-label={en.ui.closeCart}><X /></button></div>
      {items.length === 0 ? <div className="empty-cart"><div className="empty-icon"><ShoppingBag size={26} /></div><h3>{en.ui.emptyCartTitle}</h3><p>{en.ui.emptyCartBody}</p><button className="button button-red" onClick={() => { setCartOpen(false); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}>{en.ui.browseMenu} <ArrowRight size={16} /></button></div> : <>
        <div className="delivery-progress"><div className="delivery-copy"><span>{subtotal >= 100 ? en.cart.unlocked : `${100 - subtotal} DH ${en.cart.freeDelivery}`}</span><span>{subtotal >= 100 ? '—' : `${Math.min(100, Math.round(subtotal))}%`}</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, subtotal)}%` }} /></div></div>
        <div className="cart-items">{items.map((item) => <div className="cart-row" key={item.id}><div className="cart-thumb">{item.image ? <img src={item.image} alt="" /> : <span>—</span>}</div><div className="cart-row-info"><h3>{item.name}</h3><span>{formatDh(item.price)} each</span><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => changeQuantity(item.id, -1)}><Minus size={12} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => changeQuantity(item.id, 1)}><Plus size={12} /></button></div></div><div className="cart-row-price"><b>{formatDh(item.price * item.quantity)}</b><button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><X size={14} /></button></div></div>)}</div>
        <div className="upsell-box"><div className="upsell-title"><span>{en.ui.upsellTitle}</span><Sparkles size={14} /></div>{en.upsells.map((upsell) => <div className="upsell-row" key={upsell.id}><span>{upsell.name} <small>+{formatDh(upsell.price)}</small></span><button onClick={() => addUpsell(upsell)}>{en.cart.add} <Plus size={13} /></button></div>)}</div>
        <div className="cart-summary"><div><span>{en.cart.subtotal}</span><b>{formatDh(subtotal)}</b></div><div><span>{en.cart.delivery}</span><b>{delivery === 0 ? 'FREE' : formatDh(delivery)}</b></div><div className="summary-total"><span>{en.cart.total}</span><b>{formatDh(subtotal + delivery)}</b></div><button className="button button-red checkout-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>{en.cart.checkout}<ArrowRight size={18} /></button><p className="cash-note"><Check size={14} /> {en.ui.cashNote}</p></div>
      </>}
    </motion.aside></div>}</AnimatePresence>

    <AnimatePresence>{builderOpen && <div className="overlay center-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setBuilderOpen(false); }}><motion.section className="modal builder-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} aria-label="Build your box" aria-modal="true" role="dialog">
      <div className="modal-top"><span className="drawer-kicker">{en.builder.label}</span><button className="close-button" onClick={() => setBuilderOpen(false)} aria-label={en.ui.closeBuilder}><X /></button></div><div className="builder-progress"><span style={{ width: `${((builderStep + 1) / 4) * 100}%` }} /></div><p className="builder-step">{en.builder.step} 0{builderStep + 1} <span>·</span> 04</p><h2>{steps[builderStep].title}<span>.</span></h2><p className="builder-note">{steps[builderStep].note}</p><div className="builder-options">{en.builderOptions[steps[builderStep].key].map((option) => { const active = builderChoice[steps[builderStep].key]?.name === option.name; return <button className={active ? 'builder-option active' : 'builder-option'} key={option.name} onClick={() => setBuilderChoice((state) => ({ ...state, [steps[builderStep].key]: option }))}><span className="option-check">{active ? <Check size={14} /> : <Plus size={14} />}</span><span>{option.name}</span><b>{option.price ? `+${formatDh(option.price)}` : en.ui.included}</b></button>; })}</div><div className="builder-footer">{builderStep > 0 ? <button className="back-step" onClick={() => setBuilderStep((step) => step - 1)}><ArrowLeft size={15} /> {en.builder.back}</button> : <span className="builder-total-label">{en.ui.boxTotal}<b>{formatDh(builderTotal)}</b></span>}{builderStep < 3 ? <button className="button button-red" disabled={!builderChoice[steps[builderStep].key]} onClick={() => setBuilderStep((step) => step + 1)}>{en.builder.next}<ArrowRight size={15} /></button> : <button className="button button-red" disabled={!Object.values(builderChoice).every(Boolean)} onClick={addBuild}>{en.builder.add} · {formatDh(builderTotal)}<Plus size={16} /></button>}</div>
    </motion.section></div>}</AnimatePresence>

    <AnimatePresence>{matcherOpen && <div className="overlay center-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setMatcherOpen(false); }}><motion.section className="modal matcher-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} aria-label="Crave matcher" aria-modal="true" role="dialog">
      <div className="modal-top"><span className="drawer-kicker">{en.matcher.label}</span><button className="close-button" onClick={() => setMatcherOpen(false)} aria-label={en.ui.closeMatcher}><X /></button></div><p className="section-label"><span>—</span> {en.ui.findMatchLabel}</p><h2>{en.matcher.title}</h2><p className="matcher-modal-copy">{en.matcher.body}</p><div className="matcher-modal-controls"><div className="selector-group"><span>{en.ui.matchBudget}</span><div>{[30, 50, 80].map((amount) => <button className={budget === amount ? 'choice selected' : 'choice'} onClick={() => setBudget(amount)} key={amount}>{amount === 80 ? '80+ DH' : `${amount} DH`}</button>)}</div></div><div className="selector-group"><span>{en.ui.matchHunger}</span><div>{en.matcher.hunger.map((level) => <button className={hunger === level ? 'choice selected' : 'choice'} onClick={() => setHunger(level)} key={level}>{level}</button>)}</div></div></div><div className="match-result"><img src={recommendation.image} alt="" /><div><span>{en.ui.matchCaption}</span><h3>{recommendation.name}</h3><b>{formatDh(recommendation.price)}</b></div><button aria-label={en.ui.addRecommendedItem.replace('{name}', recommendation.name)} onClick={() => { addProduct(recommendation); setMatchAdded(true); }}><Plus size={17} /></button></div>{matchAdded && <p className="match-added"><Check size={14} /> {en.ui.matchAdded}</p>}
    </motion.section></div>}</AnimatePresence>

    <AnimatePresence>{checkoutOpen && <div className="overlay center-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}><motion.section className="modal checkout-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} aria-label={en.ui.checkoutDialog} aria-modal="true" role="dialog">
      <div className="modal-top"><span className="drawer-kicker">{en.ui.checkoutKicker}</span><button className="close-button" onClick={() => setCheckoutOpen(false)} aria-label={en.ui.closeCheckout}><X /></button></div>
      <h2>{en.checkout.title}<span>.</span></h2>
      <form onSubmit={submitOrder} className="checkout-form">
        <div className="fulfillment-toggle" role="group" aria-label={en.fulfillment.label}>
          <button type="button" className={fulfillment === 'delivery' ? 'fulfillment-choice active' : 'fulfillment-choice'} onClick={() => setFulfillment('delivery')}><span>{en.fulfillment.delivery}</span><small>{formatDh(delivery)}</small></button>
          <button type="button" className={fulfillment === 'pickup' ? 'fulfillment-choice active' : 'fulfillment-choice'} onClick={() => setFulfillment('pickup')}><span>{en.fulfillment.pickup}</span><small>{en.contact.pickupMinutes} min</small></button>
        </div>
        {savedFound && <span className="saved-badge" style={{ fontSize: '10px', color: '#46a878', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}><UserCheck size={12} /> Details remembered</span>}
        <label>{en.checkout.name}<input name="name" autoComplete="name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={en.ui.namePlaceholder} /></label>
        <label>{en.checkout.phone}<div className="phone-field"><span>+212</span><input name="phone" inputMode="tel" autoComplete="tel-national" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))} placeholder={en.ui.phonePlaceholder} pattern="\+212[67][0-9]{8}|[67][0-9]{8}" title={en.ui.phoneTitle} /></div></label>
        {fulfillment === 'delivery' ? <><label>{en.checkout.address}<textarea name="address" required value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder={en.ui.addressPlaceholder} rows={2} /></label><button className={gps ? 'gps-button gps-done' : 'gps-button'} type="button" onClick={shareLocation} disabled={gpsBusy}>{gps ? <Check size={15} /> : <Crosshair size={15} />}{gps ? en.ui.locationAttached : gpsBusy ? en.ui.locationBusy : en.checkout.gps}</button></> : <p className="pickup-note">{en.checkout.pickupNote}<br /><b>{en.contact.address}</b></p>}
        <div className="payment-choice"><span>{en.checkout.payment}</span><div><span className="cod-icon"><Check size={14} /></span><b>{en.checkout.cod}</b><small>{en.fulfillment.driverCash}</small></div></div>
        <label className="select-label">{en.checkout.change}<span className="select-wrap"><select name="change">{en.ui.changeOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></span></label>
        {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
        <button className="button button-red confirm-button" type="submit" disabled={checkoutSubmitting}>{checkoutSubmitting ? en.checkout.sending : en.checkout.confirm}<ArrowRight size={17} /></button>
        <p className="checkout-note">{en.checkout.note}</p>
      </form>
    </motion.section></div>}</AnimatePresence>

    <AnimatePresence>{receipt && <div className="overlay center-overlay"><motion.section className="modal receipt-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}><button className="close-button receipt-close" onClick={() => { setReceipt(false); clear(); }} aria-label={en.ui.closeReceipt}><X /></button><div className="receipt-check"><Check size={30} /></div><p className="section-label"><span>—</span> {en.ui.receiptKicker}</p><h2>{en.ui.receiptTitle[0]}<br />{en.ui.receiptTitle[1]}<span>.</span></h2><p>{en.ui.receiptBody} <b>{receiptPoints} {en.ui.pointsSuffix}</b></p><div className="receipt-total"><span>{en.ui.receiptTotal}</span><b>{formatDh(receiptTotal)}</b></div><p className="order-code">{en.ui.orderCodeLabel} <strong>{orderCode}</strong></p><a className="button button-red confirm-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">{en.ui.whatsapp}<ArrowRight size={16} /></a><a className="track-receipt-link" href={`/track?code=${encodeURIComponent(orderCode)}`}>{en.ui.trackOrder}</a><button className="receipt-back" onClick={() => { setReceipt(false); clear(); }}>{en.ui.receiptBack}</button><p className="checkout-note">{en.ui.receiptNote}</p></motion.section></div>}</AnimatePresence>
  </main>;
}

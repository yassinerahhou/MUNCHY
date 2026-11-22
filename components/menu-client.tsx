'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Plus, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supportsMealOptions } from '@/lib/product-options';
import { useLocale, categoryLabel } from '@/lib/locale';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';

type Product = import('@/lib/content-types').Product;
const money = (price: number) => `${price} DH`;

export default function MenuClient() {
  const en = useSiteContent();
  const { locale } = useLocale();
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [underForty, setUnderForty] = useState(false);
  const [sidesOnly, setSidesOnly] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  function showResults() { setFiltersOpen(false); requestAnimationFrame(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
  const selectCategory = (index: number) => { setCategoryIndex(index); setFiltersOpen(false); showResults(); };
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { items, addItem, changeQuantity, removeItem } = useCart();
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalQty = items.reduce((total, item) => total + item.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= en.contact.freeDeliveryFrom ? 0 : en.contact.deliveryFee;
  const products = useMemo(() => {
    let list = en.products.filter((product) => product.available !== false);
    if (categoryIndex !== 0) {
      const target = en.menu.categories[categoryIndex];
      if (target) list = list.filter((product) => product.category.toLowerCase() === target.toLowerCase());
    }
    if (underForty) list = list.filter((product) => product.price < 40);
    if (sidesOnly) list = list.filter((product) => ['Sides & sips', 'Sauces & extras'].includes(product.category));
    if (vegetarian) list = list.filter((product) => product.vegetarian === true);
    if (spicy) list = list.filter((product) => product.spicy === true);
    const query = search.trim().toLowerCase();
    if (query) list = list.filter((product) => `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query));
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [categoryIndex, search, sort, underForty, sidesOnly, vegetarian, spicy, en.products, en.menu.categories]);
  useEffect(() => {
    const openCart = () => setCartOpen(true);
    if (window.location.hash === '#cart') openCart();
    window.addEventListener('munchy:cart', openCart);
    return () => window.removeEventListener('munchy:cart', openCart);
  }, []);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  const addProduct = (product: Product) => { addItem({ id: product.id, name: product.name, price: product.price, image: product.image }); };

  return <main className="catalog-page">
    <div className="catalog-hero">
      <div className="catalog-breadcrumb"><a href="/">{en.catalog.home}</a><span>/</span><b>{en.nav.menu}</b></div>
      <div className="catalog-title-row"><div><p className="section-label"><span>01</span> {en.catalog.eyebrow}</p><h1>{en.catalog.title[0]}<br /><em>{en.catalog.title[1]}</em></h1><p>{en.catalog.body}</p></div><div className="catalog-side-note"><span>FRESH FROM THE GRIDDLE</span><b>{en.products.length}</b><small>THINGS TO LOVE</small></div></div>
      <div className="catalog-top-line"><span><i></i>{en.hero.open}</span><span>{en.hero.delivery}</span><span>{products.length} {en.catalog.itemCount.replace('{count}', '')}</span></div>
    </div>
    <section className="catalog-controls" aria-label={en.ui.categoryFilter}>
      <div className="catalog-search"><Search size={17} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.catalog.search} aria-label={en.catalog.search} /><kbd>⌘ K</kbd></div>
      <label className="catalog-sort"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => { setSort(event.target.value); showResults(); }} aria-label={en.catalog.sort}><option value="popular">{en.catalog.sortPopular}</option><option value="price-low">{en.catalog.sortPriceLow}</option><option value="price-high">{en.catalog.sortPriceHigh}</option></select></label><button className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={16} />Filters</button>
    </section>
    <nav className="sticky-menu-categories" aria-label="Quick menu categories">{en.menu.categories.map((item, index) => <button className={categoryIndex === index ? "active" : ""} key={index} onClick={() => selectCategory(index)}>{categoryLabel(item, locale)}</button>)}</nav>
    <div className="catalog-layout">
      <aside className={filtersOpen ? "catalog-sidebar filters-open" : "catalog-sidebar"}><span className="sidebar-label">{en.menu.label}</span><div className="catalog-categories">{en.menu.categories.map((item, index) => <button key={index} className={categoryIndex === index ? 'catalog-category active' : 'catalog-category'} onClick={() => selectCategory(index)}><span>0{index + 1}</span>{categoryLabel(item, locale)}<ArrowRight size={14} /></button>)}</div><div className="filter-box"><span>{en.catalog.filters}</span><label><input type="checkbox" checked={underForty} onChange={(event) => { setUnderForty(event.target.checked); showResults(); }} />{en.catalog.priceUnder}</label><label><input type="checkbox" checked={sidesOnly} onChange={(event) => { setSidesOnly(event.target.checked); showResults(); }} />{en.catalog.sidesOnly}</label><label><input type="checkbox" checked={vegetarian} onChange={(event) => { setVegetarian(event.target.checked); showResults(); }} />Vegetarian picks</label><label><input type="checkbox" checked={spicy} onChange={(event) => { setSpicy(event.target.checked); showResults(); }} />A little heat</label></div><div className="sidebar-promo"><span>THE EASY WIN</span><b>Free delivery<br />from {en.contact.freeDeliveryFrom} DH.</b><a href="/#matcher">Get a match <ArrowRight size={14} /></a></div></aside>
      <div className="catalog-results" ref={resultsRef} id="menu-results" tabIndex={-1}><div className="catalog-results-head"><div><span className="results-kicker">{en.menu.categories[categoryIndex]?.toUpperCase()}</span><h2>{products.length} {en.catalog.itemsLabel}</h2></div><span>{en.catalog.madeToOrder}</span></div>
        {products.length ? <div className="catalog-grid">{products.map((product, index) => <motion.article key={product.id} className="catalog-card" initial={{ opacity: 1, y: 17 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .035, .25), duration: .45 }}>
          <div className={`catalog-image ${product.tone}`}><a href={`/menu/${product.id}`} tabIndex={-1} aria-hidden="true"><Image src={product.image} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 38vw, 42vw" quality={78} /></a><span className="catalog-tag">{product.tag}</span><button className="catalog-quick" aria-label={`${en.catalog.quickView}: ${product.name}`} onClick={() => setQuickView(product)}>{en.catalog.quickView}<ArrowRight size={13} /></button></div>
          <div className="catalog-product-heading"><div><span>{product.category}</span><a href={`/menu/${product.id}`}><h3>{product.name}</h3></a></div><b>{money(product.price)}</b></div><p>{product.description}</p><div className="catalog-card-bottom">{items.some((item) => item.id === product.id) ? <div className="menu-quantity"><button aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button><span>{items.find((item) => item.id === product.id)?.quantity}</span><button aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button></div> : <button onClick={() => addProduct(product)}>{en.catalog.add}<Plus size={15} /></button>}<button className="catalog-detail-link" onClick={() => setQuickView(product)}>{en.catalog.details}</button></div>
        </motion.article>)}</div> : <div className="catalog-empty"><span>0{0}</span><h3>{en.catalog.empty}</h3><button className="button button-light" onClick={() => { setSearch(''); setCategoryIndex(0); setUnderForty(false); setSidesOnly(false); setVegetarian(false); setSpicy(false); }}>{en.catalog.clear}</button></div>}
      </div>
    </div>

    {totalQty > 0 && <button className="mobile-cart" onClick={() => setCartOpen(true)}><span><ShoppingBag size={17} /> {en.ui.viewOrder}</span><b>{money(subtotal + delivery)} <ArrowRight size={16} /></b></button>}
    <AnimatePresence>{quickView && <div className="overlay center-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickView(null); }}><motion.section className="quick-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} aria-modal="true" role="dialog" aria-label={quickView.name}>
      <button className="close-button quick-close" onClick={() => setQuickView(null)} aria-label={en.ui.closeQuickView}><X /></button><div className="quick-modal-image"><Image src={quickView.image} alt={quickView.name} fill sizes="(max-width: 700px) 90vw, 450px" quality={82} /></div><div className="quick-modal-copy"><span>{quickView.category} · {en.catalog.detailsKicker}</span><h2>{quickView.name}</h2><p>{quickView.description}</p><div className="quick-tags"><span><Check size={13} />{en.catalog.madeToOrder}</span><span>{quickView.id === 'crispy-wings' ? en.catalog.spicy : en.catalog.houseFavorite}</span></div><div className="quick-modal-footer"><b>{money(quickView.price)}</b><button className="button button-red" onClick={() => { addProduct(quickView); setQuickView(null); setCartOpen(true); }}>{en.catalog.add}<Plus size={15} /></button></div><a className="quick-detail-link" href={`/menu/${quickView.id}`}>{supportsMealOptions(quickView) ? 'Choose sauce, sides & soda' : en.catalog.fullDetails}<ArrowRight size={14} /></a></div>
    </motion.section></div>}</AnimatePresence>
    <AnimatePresence>{cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><motion.aside className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} aria-modal="true" role="dialog" aria-label={en.ui.orderDialog}>
      <div className="drawer-head"><div><span className="drawer-kicker">{en.cart.kicker}</span><h2>{en.cart.title}<span>.</span></h2></div><button className="close-button" onClick={() => setCartOpen(false)} aria-label={en.ui.closeCart}><X /></button></div>
      {items.length === 0 ? <div className="empty-cart"><div className="empty-icon"><ShoppingBag size={26} /></div><h3>{en.ui.emptyCartTitle}</h3><p>{en.ui.emptyCartBody}</p><button className="button button-red" onClick={() => setCartOpen(false)}>{en.ui.browseMenu}<ArrowRight size={16} /></button></div> : <>
        <div className="delivery-progress"><div className="delivery-copy"><span>{subtotal >= en.contact.freeDeliveryFrom ? en.cart.unlocked : `${en.contact.freeDeliveryFrom - subtotal} DH ${en.cart.freeDelivery}`}</span><span>{subtotal >= en.contact.freeDeliveryFrom ? '—' : `${Math.min(100, Math.round(subtotal / en.contact.freeDeliveryFrom * 100))}%`}</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, subtotal / en.contact.freeDeliveryFrom * 100)}%` }} /></div></div>
        <div className="cart-items">{items.map((item) => <div className="cart-row" key={item.id}><div className="cart-thumb">{item.image && <Image src={item.image} alt="" width={62} height={62} sizes="62px" />}</div><div className="cart-row-info"><h3>{item.name}</h3><span>{money(item.price)} {en.catalog.each}</span><div className="quantity-control"><button aria-label={en.ui.decreaseQuantity} onClick={() => changeQuantity(item.id, -1)}><span>−</span></button><span>{item.quantity}</span><button aria-label={en.ui.increaseQuantity} onClick={() => changeQuantity(item.id, 1)}><Plus size={12} /></button></div></div><div className="cart-row-price"><b>{money(item.price * item.quantity)}</b><button onClick={() => removeItem(item.id)} aria-label={en.ui.removeItem.replace('{name}', item.name)}><X size={14} /></button></div></div>)}</div>
        <div className="cart-summary"><div><span>{en.cart.subtotal}</span><b>{money(subtotal)}</b></div><div><span>{en.cart.delivery}</span><b>{delivery === 0 ? en.catalog.free : money(delivery)}</b></div><div className="summary-total"><span>{en.cart.total}</span><b>{money(subtotal + delivery)}</b></div><a className="button button-red checkout-button" href="/checkout">{en.cart.checkout}<ArrowRight size={18} /></a><p className="cash-note"><Check size={14} /> {en.ui.cashNote}</p></div>
      </>}
    </motion.aside></div>}</AnimatePresence>
  </main>;
}

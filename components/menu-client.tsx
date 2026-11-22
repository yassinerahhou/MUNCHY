'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Plus, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import Image from '@/components/food-image';
import { useExperience } from '@/components/experience-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
import { fuzzyMatch, containsExcluded, exclusions, type Exclusion } from '@/lib/menu-search';
import MenuMemory from '@/components/menu-memory';
import { GroupCartControls } from '@/components/group-cart';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supportsMealOptions } from '@/lib/product-options';
import { useLocale, categoryLabel } from '@/lib/locale';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';

type Product = import('@/lib/content-types').Product;
const money = (price: number) => `${price} DH`;

export default function MenuClient() {
  const en = useSiteContent();
  const t = useExperienceCopy();
  const { openDish, openCart } = useExperience();
  const [excluded, setExcluded] = useState<Exclusion[]>([]);
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
  const setQuickView = openDish;
  const setCartOpen = (value: boolean) => { if (value) openCart(); };
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
    list = list.filter(product => !containsExcluded(product, excluded));
    const query = search.trim();
    if (query) list = list.filter((product) => fuzzyMatch(`${product.name} ${product.description} ${product.category}`, query));
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [categoryIndex, search, sort, underForty, sidesOnly, vegetarian, spicy, en.products, en.menu.categories, excluded]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  const addProduct = (product: Product) => { addItem({ id: product.id, name: product.name, price: product.price, image: product.image }); };

  return <main className="catalog-page" id="main-content">
    <div className="catalog-hero">
      <div className="catalog-breadcrumb"><a href="/">{en.catalog.home}</a><span>/</span><b>{en.nav.menu}</b></div>
      <div className="catalog-title-row"><div><p className="section-label"><span>01</span> {en.catalog.eyebrow}</p><h1>{en.catalog.title[0]}<br /><em>{en.catalog.title[1]}</em></h1><p>{en.catalog.body}</p></div><div className="catalog-side-note"><span>FRESH FROM THE GRIDDLE</span><b>{en.products.length}</b><small>THINGS TO LOVE</small></div></div>
      <div className="catalog-top-line"><span><i></i>{en.hero.open}</span><span>{en.hero.delivery}</span><span>{products.length} {en.catalog.itemCount.replace('{count}', '')}</span></div>
    </div>
    <MenuMemory /><div className="menu-builder-link"><GroupCartControls /><a className="editorial-link" href="/build">{en.ui.buildBox}<ArrowRight size={15} /></a></div>
    <section className="catalog-controls" aria-label={en.ui.categoryFilter}>
      <div className="catalog-search"><Search size={17} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.catalog.search} aria-label={en.catalog.search} /><kbd>⌘ K</kbd></div>
      <label className="catalog-sort"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => { setSort(event.target.value); showResults(); }} aria-label={en.catalog.sort}><option value="popular">{en.catalog.sortPopular}</option><option value="price-low">{en.catalog.sortPriceLow}</option><option value="price-high">{en.catalog.sortPriceHigh}</option></select></label><button className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={16} />Filters</button>
    </section>
    <div className="allergen-filters"><span>{t.allergy}</span>{exclusions.map(key => <button key={key} type="button" aria-pressed={excluded.includes(key)} onClick={() => { setExcluded(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]); showResults(); }}>{key === 'Nuts' ? (locale === 'fr' ? 'Fruits à coque' : locale === 'ar' ? 'المكسرات' : key) : key === 'Dairy' ? (locale === 'fr' ? 'Lait' : locale === 'ar' ? 'الحليب' : key) : key === 'Gluten' ? (locale === 'ar' ? 'الغلوتين' : key) : (locale === 'fr' ? 'Épicé' : locale === 'ar' ? 'الحار' : key)}</button>)}<small>{t.allergyNote}</small></div>
    <nav className="sticky-menu-categories" aria-label="Quick menu categories">{en.menu.categories.map((item, index) => <button aria-pressed={categoryIndex === index} className={categoryIndex === index ? "active" : ""} key={index} onClick={() => selectCategory(index)}>{categoryIndex === index && <motion.span className="category-motion-marker" layoutId="menu-category" />}{categoryLabel(item, locale)}</button>)}</nav>
    <div className="catalog-layout">
      <aside className={filtersOpen ? "catalog-sidebar filters-open" : "catalog-sidebar"}><span className="sidebar-label">{en.menu.label}</span><div className="catalog-categories">{en.menu.categories.map((item, index) => <button key={index} className={categoryIndex === index ? 'catalog-category active' : 'catalog-category'} onClick={() => selectCategory(index)}><span>0{index + 1}</span>{categoryLabel(item, locale)}<ArrowRight size={14} /></button>)}</div><div className="filter-box"><span>{en.catalog.filters}</span><label><input type="checkbox" checked={underForty} onChange={(event) => { setUnderForty(event.target.checked); showResults(); }} />{en.catalog.priceUnder}</label><label><input type="checkbox" checked={sidesOnly} onChange={(event) => { setSidesOnly(event.target.checked); showResults(); }} />{en.catalog.sidesOnly}</label><label><input type="checkbox" checked={vegetarian} onChange={(event) => { setVegetarian(event.target.checked); showResults(); }} />Vegetarian picks</label><label><input type="checkbox" checked={spicy} onChange={(event) => { setSpicy(event.target.checked); showResults(); }} />A little heat</label></div><div className="sidebar-promo"><span>THE EASY WIN</span><b>Free delivery<br />from {en.contact.freeDeliveryFrom} DH.</b><a href="/#matcher">Get a match <ArrowRight size={14} /></a></div></aside>
      <div className="catalog-results" ref={resultsRef} id="menu-results" tabIndex={-1}><div className="catalog-results-head"><div><span className="results-kicker">{en.menu.categories[categoryIndex]?.toUpperCase()}</span><h2>{products.length} {en.catalog.itemsLabel}</h2></div><span>{en.catalog.madeToOrder}</span></div>
        {products.length ? <div className="catalog-grid">{products.map((product, index) => <motion.article key={product.id} className="catalog-card" initial={{ opacity: 1, y: 17 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .035, .25), duration: .45 }}>
          <motion.div layoutId={`dish-image-${product.id}`} className={`catalog-image ${product.tone}`}><button className="catalog-photo-button" onClick={() => openDish(product)} aria-label={`${t.view}: ${product.name}`}><Image src={product.image} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 38vw, 42vw" quality={78} /></button><span className="catalog-tag">{product.tag}</span><button className="catalog-quick" aria-label={`${en.catalog.quickView}: ${product.name}`} onClick={() => setQuickView(product)}>{en.catalog.quickView}<ArrowRight size={13} /></button></motion.div>
          <div className="catalog-product-heading"><div><span>{product.category}</span><h3><button className="catalog-name-button" onClick={() => openDish(product)}>{product.name}</button></h3></div><b>{money(product.price)}</b></div><p>{product.description}</p><div className="portion-line">{product.portion || "Feeds 1"}{product.spicy ? " · ●●○" : ""}</div><div className="catalog-card-bottom">{items.some((item) => item.id === product.id) ? <div className="menu-quantity"><button aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button><span>{items.find((item) => item.id === product.id)?.quantity}</span><button aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button></div> : <button onClick={() => openDish(product)}>{en.catalog.add}<Plus size={15} /></button>}<button className="catalog-detail-link" onClick={() => setQuickView(product)}>{en.catalog.details}</button></div>
        </motion.article>)}</div> : <div className="catalog-empty"><span>0{0}</span><h3>{t.empty}</h3><div className="recommended-empty">{en.products.filter(p => p.available !== false && !containsExcluded(p, excluded)).slice(0, 3).map(p => <button key={p.id} onClick={() => openDish(p)}><span><Image src={p.image} alt={p.name} fill sizes="150px" /></span><b>{p.name}</b><small>{p.price} DH</small></button>)}</div><button className="button button-light" onClick={() => { setSearch(''); setCategoryIndex(0); setUnderForty(false); setSidesOnly(false); setVegetarian(false); setSpicy(false); setExcluded([]); }}>{en.catalog.clear}</button></div>}
      </div>
    </div>

  </main>;
}

'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Share2 } from 'lucide-react';
import type { Product } from '@/lib/content-types';
import type { RequestKind } from '@/lib/hospitality';
import { useSiteContent } from '@/components/content-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
import { useCart } from '@/lib/cart';
import { configuredProduct, supportsMealOptions, type Selection } from '@/lib/product-options';
import { track } from '@/lib/analytics';
import { shareCart } from '@/lib/cart-share';
import { useLocale } from '@/lib/locale';
import { optionLabel } from '@/locales/menu-copy';
import FoodImage from '@/components/food-image';
import DialogShell from '@/components/dialog-shell';
import HospitalityForm from '@/components/hospitality-form';
import { GroupCartControls } from '@/components/group-cart';

export default function ExperienceDialogs({ state, close }: { state: { cart: boolean; dish: Product | null; form: RequestKind | null }; close: () => void }) {
  const stableClose = useCallback(close, [close]);
  return <AnimatePresence>{state.cart && <DialogShell key="bag" title="Munchy cart" close={stableClose} sheet><CartPanel close={stableClose} /></DialogShell>}{state.dish && <DialogShell key={state.dish.id} title={state.dish.name} close={stableClose} className="exp-dish"><DishPanel product={state.dish} /></DialogShell>}{state.form && <DialogShell key={state.form} title={`Munchy ${state.form}`} close={stableClose}><HospitalityForm kind={state.form} /></DialogShell>}</AnimatePresence>;
}
function CartPanel({ close }: { close: () => void }) {
  const content = useSiteContent(), t = useExperienceCopy();
  const { items, changeQuantity, removeItem, addItem } = useCart();
  const [message, setMessage] = useState('');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = !items.length || subtotal >= content.contact.freeDeliveryFrom ? 0 : content.contact.deliveryFee;
  const suggestions = content.products.filter(p => p.available !== false && ['Sides & sips', 'Loaded fries'].includes(p.category) && !items.some(item => (item.productId || item.id) === p.id)).slice(0, 2);
  async function share() {
    const encoded = shareCart(items);
    const url = new URL('/menu', window.location.origin); url.hash = `bag=${encoded}`;
    try { await navigator.clipboard.writeText(url.href); setMessage(t.shared); }
    catch { setMessage(url.href); }
  }
  return <div className="exp-cart"><p className="exp-eyebrow">DIRECT FROM OUR KITCHEN</p><h2>{t.bag}<span>.</span></h2><GroupCartControls />{!items.length ? <div className="exp-empty"><ShoppingBag size={40} /><h3>{t.emptyBag}</h3><a className="exp-button" href="/menu" onClick={close}>{t.browse}<ArrowRight size={16} /></a></div> : <>
    <p className="bag-delivery">{subtotal >= content.contact.freeDeliveryFrom ? content.cart.unlocked : `${Math.max(0, content.contact.freeDeliveryFrom - subtotal)} DH ${content.cart.freeDelivery}`}</p>
    <div className="exp-cart-rows">{items.map(item => <article key={item.id}><div className="exp-cart-photo">{item.image && <FoodImage src={item.image} alt="" fill sizes="72px" />}</div><div><h3>{item.name}</h3><small>{item.price} DH · {item.spice || 'house'}{item.kitchenNotes ? ` · ${item.kitchenNotes}` : ''}</small><div className="exp-qty"><button aria-label={`Decrease ${item.name}`} onClick={() => changeQuantity(item.id, -1)}><Minus size={14} /></button><b>{item.quantity}</b><button aria-label={`Increase ${item.name}`} disabled={item.quantity >= 10} onClick={() => changeQuantity(item.id, 1)}><Plus size={14} /></button><button className="exp-remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>×</button></div></div><b>{item.price * item.quantity} DH</b></article>)}</div>
    <div className="exp-cross-sells"><p>{content.ui.upsellTitle}</p>{suggestions.map(p => <button key={p.id} onClick={() => addItem({ id: p.id, productId: p.id, name: p.name, price: p.price, image: p.image })}>{p.name}<span>+{p.price} DH <Plus size={14} /></span></button>)}</div>
    <button className="exp-share" onClick={share}><Share2 size={15} />{t.share}</button><small>{t.shareNote}</small>{message && <p role="status" className="share-result">{message}</p>}
    <div className="exp-bag-total"><p><span>{t.subtotal}</span><b>{subtotal} DH</b></p><p><span>{t.delivery}</span><b>{delivery} DH</b></p><p><span>{t.total}</span><b>{subtotal + delivery} DH</b></p><a className="exp-button" href="/checkout">{t.checkout}<ArrowRight size={18} /></a><small>{t.cartHint}</small></div>
  </>}</div>;
}
function DishPanel({ product }: { product: Product }) {
  const content = useSiteContent(), t = useExperienceCopy(), { addItem } = useCart();
  const { locale } = useLocale();
  const [choices, setChoices] = useState<Record<string, string>>({}), [counts, setCounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1), [notes, setNotes] = useState(''), [spice, setSpice] = useState<'mild' | 'house' | 'hot'>('house'), [added, setAdded] = useState(false);
  const selections: Selection[] = supportsMealOptions(product) ? content.mealOptions.map(g => ({ key: g.key, option: choices[g.key] || g.choices[0]?.name || '', quantity: counts[g.key] || 1 })) : [];
  const configured = configuredProduct(product, selections, content);
  useEffect(() => { setAdded(false); }, [choices, counts, quantity, notes, spice]);
  function add() {
    if (!configured) return;
    const signature = JSON.stringify([selections, spice, notes]);
    let hash = 2166136261; for (const char of signature) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const id = `${product.id}--${(hash >>> 0).toString(36)}`;
    for (let i = 0; i < quantity; i++) addItem({ ...configured, id, spice, kitchenNotes: notes.trim() });
    setAdded(true); track('add_to_cart', { item_id: product.id, quantity });
  }
  return <><motion.div layoutId={`dish-image-${product.id}`} className="exp-dish-photo"><FoodImage src={product.image} alt={product.name} fill sizes="(max-width:768px) 95vw, 480px" /><small>{product.photoNote}</small></motion.div><div className="exp-dish-copy"><p className="exp-eyebrow">{product.category}</p><h2>{product.name}</h2><p>{product.description}</p><div className="exp-dish-flags"><span>{product.portion || 'Feeds 1'}</span>{product.spicy && <span>●●○ · Spicy</span>}<b>{product.price} DH</b></div>
    {supportsMealOptions(product) && content.mealOptions.map(group => <fieldset className="exp-options" key={group.key}><legend>{optionLabel(group.title, locale)}</legend><div>{group.choices.map(option => <label key={option.name} className={(choices[group.key] || group.choices[0]?.name) === option.name ? 'selected' : ''}><input type="radio" name={`dish-${group.key}`} checked={(choices[group.key] || group.choices[0]?.name) === option.name} onChange={() => setChoices(c => ({ ...c, [group.key]: option.name }))} /><span>{optionLabel(option.name, locale)}</span><b>{option.price ? `+${option.price} DH` : '—'}</b></label>)}</div>{['side', 'drink'].includes(group.key) && group.choices.find(o => o.name === choices[group.key])?.price ? <div className="exp-qty"><button aria-label={`Fewer ${group.key}`} disabled={(counts[group.key] || 1) <= 1} onClick={() => setCounts(c => ({ ...c, [group.key]: Math.max(1, (c[group.key] || 1) - 1) }))}><Minus size={14} /></button><b>{counts[group.key] || 1}</b><button aria-label={`More ${group.key}`} disabled={(counts[group.key] || 1) >= 6} onClick={() => setCounts(c => ({ ...c, [group.key]: Math.min(6, (c[group.key] || 1) + 1) }))}><Plus size={14} /></button></div> : null}</fieldset>)}
    <fieldset className="exp-options"><legend>{t.spice}</legend><div className="exp-spice">{(['mild', 'house', 'hot'] as const).map(value => <label key={value} className={spice === value ? 'selected' : ''}><input type="radio" name="dish-spice" checked={spice === value} onChange={() => setSpice(value)} />{t[value]}</label>)}</div></fieldset>
    <label className="exp-field">{t.notes}<textarea value={notes} maxLength={240} rows={2} onChange={e => setNotes(e.target.value)} /></label><small>{t.cookingNote}</small>
    <details className="exp-allergens"><summary>{t.allergens}</summary><p>{product.ingredients?.join(' · ')}</p><p>{product.allergens}</p><small>{t.allergyNote}</small></details>
    <div className="exp-dish-purchase"><div className="exp-qty"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}><Minus size={16} /></button><b>{quantity}</b><button aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity(q => q + 1)}><Plus size={16} /></button></div><motion.button className="exp-button" disabled={!configured} whileTap={{ scale: .96 }} onClick={add}>{added ? <Check size={17} /> : <Plus size={17} />}{added ? t.added : t.add}<b>{(configured?.price || product.price) * quantity} DH</b></motion.button></div><a className="exp-detail-link" href={`/menu/${product.id}`}>{t.detail}<ArrowRight size={14} /></a>
  </div></>;
}

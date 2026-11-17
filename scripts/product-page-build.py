from pathlib import Path
p=Path('components/product-detail.tsx');p.write_text('''\
'use client';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag, Clock3, Bike, PackageCheck, ShieldCheck, Flame } from 'lucide-react';
import { useState } from 'react';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';
import { configuredProduct, supportsMealOptions, type Selection } from '@/lib/product-options';
import type { Product } from '@/lib/content-types';

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const en = useSiteContent();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const configurable = supportsMealOptions(product);
  const selections: Selection[] = configurable ? en.mealOptions.map((group) => ({ key: group.key, option: choices[group.key] || group.choices[0]?.name || '' })) : [];
  const configured = configuredProduct(product, selections, en);
  const unitPrice = configured?.price ?? product.price;
  const extras = unitPrice - product.price;
  const ingredients = product.ingredients?.length ? product.ingredients : product.description.replace(/\\.$/, '').split(/, | and /).map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  const portion = product.portion || (product.category === 'Pizzas' ? 'One pizza · individual serving' : ['Sides & sips', 'Sauces & extras'].includes(product.category) ? 'One serving · see item name for size' : 'One generously filled serving');
  const addToCart = () => {
    if (!configured) return;
    const suffix = selections.map((selection) => en.mealOptions.find((group) => group.key === selection.key)?.choices.findIndex((option) => option.name === selection.option)).join('-');
    const id = selections.length ? `${product.id}--${suffix}` : product.id;
    for (let index = 0; index < quantity; index++) addItem({ ...configured, id });
    setAdded(true);
  };
  return <main className="product-page product-page-full">
    <div className="catalog-breadcrumb"><a href="/">Home</a><span>/</span><a href="/menu">Menu</a><span>/</span><b>{product.name}</b></div>
    <section className="product-detail-grid">
      <div className="product-visual-column"><div className={`product-detail-image ${product.tone}`}><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 700px) 92vw, 48vw" quality={82} /><span>{product.tag}</span><small className="dish-photo-note">{product.photoNote || 'Serving suggestion · illustrative menu photography'}</small></div><div className="product-photo-caption"><span>{en.branding.name} / THE MENU</span><b>{product.category}</b></div><div className="product-service-cards"><div><Clock3 size={20} /><b>Cooked for your order</b><span>Pickup around {en.contact.pickupMinutes} min after confirmation</span></div><div><Bike size={20} /><b>Casa, delivered</b><span>{en.contact.deliveryMinutes} min estimate · kitchen confirms timing</span></div></div></div>
      <div className="product-detail-copy"><p className="section-label">{product.category.toUpperCase()} / MADE TO ORDER</p><div className="dish-flags">{product.vegetarian && <span>Vegetarian recipe</span>}{product.spicy && <span><Flame size={13} />A little heat</span>}<span>{portion}</span></div><h1>{product.name}<span>.</span></h1><p className="detail-description">{product.description}</p><div className="dish-base-price"><b>{product.price} <small>DH</small></b><span>Item price before optional extras</span></div>
      {configurable && <div className="meal-configurator"><div className="meal-config-heading"><h2>Make it yours.</h2><span>Optional choices · price updates below</span></div>{en.mealOptions.map((group, index) => <fieldset className="meal-option-group" key={group.key}><legend><span>0{index + 1}</span>{group.title}</legend><div>{group.choices.map((option) => { const selected = (choices[group.key] || group.choices[0]?.name) === option.name; return <label className={selected ? 'meal-option selected' : 'meal-option'} key={option.name}><input type="radio" name={group.key} value={option.name} checked={selected} onChange={() => { setChoices((current) => ({ ...current, [group.key]: option.name })); setAdded(false); }} /><span>{option.name}</span><b>{option.price ? `+${option.price} DH` : 'Included'}</b></label>; })}</div></fieldset>)}</div>}
      <div className="dish-order-summary" aria-live="polite"><div><span>{product.name}</span><b>{product.price} DH</b></div>{extras > 0 && <div><span>Selected extras, side & drink</span><b>+{extras} DH</b></div>}<div className="dish-total"><span>{quantity} × your selection</span><b>{unitPrice * quantity} DH</b></div><small>Delivery calculated at checkout. Pickup is free.</small></div>
      <div className="detail-purchase"><div className="quantity-control detail-quantity"><button disabled={quantity <= 1} onClick={() => { setQuantity((current) => Math.max(1, current - 1)); setAdded(false); }} aria-label="Decrease quantity"><Minus size={16} /></button><span>{quantity}</span><button disabled={quantity >= 10} onClick={() => { setQuantity((current) => Math.min(10, current + 1)); setAdded(false); }} aria-label="Increase quantity"><Plus size={16} /></button></div><button className="button button-red" disabled={!configured} onClick={addToCart}><ShoppingBag size={17} />{added ? 'Add another' : 'Add to order'}<span>{unitPrice * quantity} DH</span></button></div>{added && <div className="dish-added" role="status"><Check size={17} /><span>Your selection is in the bag.</span><a href="/menu#cart">View order<ArrowRight size={15} /></a></div>}<p className="dish-payment"><ShieldCheck size={15} />Pay cash on delivery or collection · no account needed</p>
      </div>
    </section>
    <section className="dish-details-section"><div><p className="section-label">A CLOSER LOOK</p><h2>All the good details.</h2><p>Know what is in your order before it reaches your table.</p></div><div className="dish-detail-panels"><details open><summary>What’s inside <Plus size={17} /></summary><ul>{ingredients.map((ingredient, index) => <li key={index}><Check size={14} />{ingredient}</li>)}</ul><p>{portion}. Drinks and side dishes are only included when selected above.</p></details><details><summary>Allergens & dietary needs <Plus size={17} /></summary><p>{product.allergens || 'Our kitchen handles wheat, milk, eggs, sesame, soy and other allergens. Ingredients vary by item. Cross-contact is possible. Contact the kitchen before ordering if you have an allergy.'}</p><a href="/help">Talk to the kitchen before ordering →</a></details><details><summary>Delivery, pickup & changes <Plus size={17} /></summary><p>Delivery costs {en.contact.deliveryFee} DH, or is free from {en.contact.freeDeliveryFrom} DH. Pickup: {en.contact.address}. The kitchen confirms availability and timing on WhatsApp. To change your order, contact the kitchen before preparation begins.</p><a href="/help">Delivery areas and ordering help →</a></details></div></section>
    <section className="related-products"><div className="related-heading"><div><p className="section-label">KEEP EXPLORING</p><h2>Another good choice.</h2></div><a href="/menu">The full menu<ArrowRight size={14} /></a></div><div className="related-grid">{related.map((item) => <a href={`/menu/${item.id}`} className="related-card" key={item.id}><div><Image src={item.image} alt={item.name} fill sizes="(max-width: 700px) 44vw, 30vw" quality={75} /></div><span>{item.category}</span><b>{item.name}</b><small>{item.price} DH</small></a>)}</div></section>
    <a className="back-to-menu" href="/menu"><ArrowLeft size={15} />Back to the menu</a>
  </main>;
}
''',encoding='utf-8')

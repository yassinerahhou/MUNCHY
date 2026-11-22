'use client';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';
import { useExperience } from '@/components/experience-provider';
export default function BoxBuilder() {
  const c = useSiteContent(), { addItem } = useCart(), { openCart } = useExperience();
  const [choices, setChoices] = useState<Record<string, string>>({}), [added, setAdded] = useState(false);
  const keys = ['base', 'protein', 'sauce', 'side'] as const;
  const selections = keys.flatMap(key => { const option = c.builderOptions[key].find(o => o.name === choices[key]); return option ? [{ key, option: option.name, price: option.price }] : []; });
  const total = selections.reduce((sum, item) => sum + item.price, 0);
  function add() {
    const customization = selections.map(({ key, option }) => ({ key, option }));
    addItem({ id: `custom-box-${crypto.randomUUID()}`, name: `Build your box · ${selections.map(s => s.option).join(' · ')}`, price: total, customization }); setAdded(true); openCart();
  }
  return <div className="box-builder"><p className="exp-eyebrow">{c.builder.label}</p><h1>{c.builder.title}</h1><p>{c.ui.comboBody}</p>{keys.map((key, index) => <fieldset className="exp-options" key={key}><legend>0{index + 1} / {key.toUpperCase()}</legend><div>{c.builderOptions[key].map(option => <label className={choices[key] === option.name ? 'selected' : ''} key={option.name}><input type="radio" required name={key} checked={choices[key] === option.name} onChange={() => { setChoices(old => ({ ...old, [key]: option.name })); setAdded(false); }} />{option.name}<b>{option.price} DH</b></label>)}</div></fieldset>)}<button className="exp-button" disabled={!['base', 'protein', 'sauce'].every(key => choices[key])} onClick={add}>{added ? <Check size={17} /> : <ArrowRight size={17} />}{c.builder.add}<b>{total} DH</b></button></div>;
}

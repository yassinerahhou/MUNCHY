'use client';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import type { SiteContent } from '@/lib/content-types';
export default function CategoryManager({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  function rename(oldName: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed || (trimmed !== oldName && content.menu.categories.includes(trimmed))) { setError('Choose a unique category name.'); return; }
    setError(''); onChange({ ...content, menu: { ...content.menu, categories: content.menu.categories.map((item) => item === oldName ? trimmed : item) }, products: content.products.map((product) => product.category === oldName ? { ...product, category: trimmed } : product) });
  }
  function move(index: number, step: number) {
    const next = [...content.menu.categories]; const destination = index + step;
    if (destination < 1 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange({ ...content, menu: { ...content.menu, categories: next } });
  }
  return <div className="category-manager"><p>Renaming a category also updates its products. Move products to another category before removing their current category. “Everything” stays first.</p>{error && <p className="form-error" role="alert">{error}</p>}{content.menu.categories.map((category, index) => <div className="category-manager-row" key={index}><input aria-label={`Category ${index + 1}`} defaultValue={category} key={category} disabled={category === 'Everything'} onBlur={(event) => rename(category, event.target.value)} /><span>{content.products.filter((product) => product.category === category).length} items</span>{index > 0 && <><button type="button" aria-label={`Move ${category} up`} disabled={index === 1} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Move ${category} down`} disabled={index === content.menu.categories.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button type="button" aria-label={`Remove ${category}`} disabled={content.products.some((product) => product.category === category)} onClick={() => onChange({ ...content, menu: { ...content.menu, categories: content.menu.categories.filter((item) => item !== category) } })}><Trash2 size={15} /></button></>}</div>)}<div className="category-manager-add"><input aria-label="New category name" value={newName} maxLength={60} placeholder="New category name" onChange={(event) => setNewName(event.target.value)} /><button className="cms-subtle" type="button" onClick={() => { const name = newName.trim(); if (!name || content.menu.categories.includes(name)) { setError('Choose a unique category name.'); return; } onChange({ ...content, menu: { ...content.menu, categories: [...content.menu.categories, name] } }); setNewName(''); setError(''); }}><Plus size={15} />Add category</button></div></div>;
}

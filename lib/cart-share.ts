import type { CartItem } from '@/lib/cart';
import type { SiteContent } from '@/lib/content-types';
import { configuredProduct } from '@/lib/product-options';
export function shareCart(items: CartItem[]) {
  const input = items.slice(0, 20).map(({ productId, id, selections, quantity, kitchenNotes, spice, customization }) => ({ productId: productId || id, selections: selections || [], quantity, kitchenNotes, spice, customization }));
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function receiveCart(encoded: string, content: SiteContent): CartItem[] {
  try {
    if (encoded.length > 32000) return [];
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const input: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
    if (!Array.isArray(input) || input.length > 20) return [];
    return input.flatMap((item, index) => {
      if (!item || typeof item !== 'object' || typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) return [];
      if (item.productId.startsWith('custom-box-')) return refreshCart([{ id: `custom-box-shared-${index}`, name: '', price: 0, quantity: item.quantity, customization: item.customization }], content);
      const product = content.products.find(p => p.id === item.productId && p.available !== false);
      if (!product) return [];
      const configured = configuredProduct(product, Array.isArray(item.selections) ? item.selections : [], content);
      if (!configured) return [];
      return [{ ...configured, id: `${product.id}--shared-${index}`, quantity: item.quantity, kitchenNotes: typeof item.kitchenNotes === 'string' ? item.kitchenNotes.slice(0, 240) : '', spice: ['mild', 'house', 'hot'].includes(item.spice) ? item.spice : 'house' } as CartItem];
    });
  } catch { return []; }
}
export function refreshCart(items: CartItem[], content: SiteContent): CartItem[] {
  return items.flatMap(item => {
    if (item.id.startsWith('custom-box-')) {
      if (!Array.isArray(item.customization) || item.customization.length < 3 || item.customization.length > 4) return [];
      const seen = new Set<string>(); let total = 0;
      for (const selection of item.customization) {
        if (!selection || !['base', 'protein', 'sauce', 'side'].includes(selection.key) || seen.has(selection.key)) return [];
        seen.add(selection.key);
        const option = content.builderOptions[selection.key as keyof typeof content.builderOptions].find(value => value.name === selection.option);
        if (!option) return []; total += option.price;
      }
      return ['base', 'protein', 'sauce'].every(key => seen.has(key)) ? [{ ...item, price: total, name: `Build your box · ${item.customization.map(s => s.option).join(' · ')}` }] : [];
    }
    const product = content.products.find(p => p.id === (item.productId || item.id) && p.available !== false);
    if (!product) return [];
    const configured = configuredProduct(product, item.selections || [], content);
    return configured ? [{ ...item, ...configured }] : [];
  });
}

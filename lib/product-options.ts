import type { Product, SiteContent } from '@/lib/content-types';
export type Selection = { key: string; option: string; quantity?: number };
export type OptionGroup = { key: string; title: string; choices: Array<{ name: string; price: number }> };
export const defaultMealOptions: OptionGroup[] = [
  { key: 'sauce', title: 'Choose your sauce', choices: [{ name: 'House recipe', price: 0 }, { name: 'Garlic sauce', price: 0 }, { name: 'Algerian sauce', price: 3 }, { name: 'Harissa mayo', price: 3 }, { name: 'Barbecue', price: 0 }, { name: 'Samurai sauce', price: 0 }, { name: 'Andalouse', price: 0 }, { name: 'Curry sauce', price: 0 }, { name: 'Ketchup', price: 0 }, { name: 'No sauce', price: 0 }] },
  { key: 'extra', title: 'Make it extra', choices: [{ name: 'No extra', price: 0 }, { name: 'Extra cheddar', price: 7 }, { name: 'Caramelized onions', price: 5 }] },
  { key: 'side', title: 'Add a side', choices: [{ name: 'No side', price: 0 }, { name: 'Seasoned fries', price: 12 }, { name: 'Loaded fries', price: 25 }] },
  { key: 'drink', title: 'Something cold?', choices: [{ name: 'No drink', price: 0 }, { name: 'Cola · 33cl', price: 12 }, { name: 'Orange soda · 33cl', price: 12 }, { name: 'Lemon soda · 33cl', price: 12 }, { name: 'Still water · 50cl', price: 8 }] },
];
export function supportsMealOptions(product: Product) { return !['Sides & sips', 'Sauces & extras'].includes(product.category); }
export function resolveSelections(product: Product, input: unknown, groups: OptionGroup[]): { selections: Selection[]; extra: number; summary: string } | null {
  if (input === undefined) return { selections: [], extra: 0, summary: '' };
  if (!Array.isArray(input) || input.length > groups.length || (!supportsMealOptions(product) && input.length)) return null;
  const seen = new Set<string>(); const selections: Selection[] = []; let extra = 0; const labels: string[] = [];
  for (const value of input) {
    if (!value || typeof value !== 'object') return null;
    const group = groups.find((entry) => entry.key === value.key);
    const choice = group?.choices.find((entry) => entry.name === value.option);
    if (!group || !choice || seen.has(group.key)) return null;
    const quantity = value.quantity === undefined ? 1 : Number(value.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > (['side', 'drink'].includes(group.key) ? 6 : 1)) return null;
    seen.add(group.key); selections.push({ key: group.key, option: choice.name, quantity }); extra += choice.price * quantity;
    if (!['No extra', 'No side', 'No drink', 'House recipe'].includes(choice.name)) labels.push(quantity > 1 ? `${quantity} × ${choice.name}` : choice.name);
  }
  return { selections, extra, summary: labels.join(' · ') };
}
export function configuredProduct(product: Product, selections: Selection[], content: SiteContent) {
  const options = resolveSelections(product, selections, content.mealOptions);
  if (!options) return null;
  return { productId: product.id, name: product.name + (options.summary ? ` · ${options.summary}` : ''), price: product.price + options.extra, image: product.image, selections: options.selections };
}

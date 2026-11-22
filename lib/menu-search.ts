export function fold(text: string) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function edits(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old; } }
  return row[b.length];
}
export function fuzzyMatch(text: string, query: string) {
  const normalized = fold(text), tokens = normalized.split(/\s+/);
  return fold(query).trim().split(/\s+/).filter(Boolean).every(term => normalized.includes(term) || (term.length >= 4 && tokens.some(token => edits(term, token.replace(/[^\p{L}\p{N}]/gu, '')) <= 1)));
}
export const exclusions = ['Nuts', 'Dairy', 'Gluten', 'Spicy'] as const;
export type Exclusion = typeof exclusions[number];
export function containsExcluded(product: { allergens?: string; spicy?: boolean }, excluded: Exclusion[]) {
  const allergens = fold(product.allergens || '');
  // Unknown allergen information is excluded when ingredient filters are active.
  return excluded.some(key => key === 'Spicy' ? product.spicy : !allergens || (key === 'Nuts' ? /nut|peanut|almond|noix|arachide/.test(allergens) : key === 'Dairy' ? /milk|cheese|dairy|lait|fromage/.test(allergens) : /wheat|gluten|ble|bread/.test(allergens)));
}

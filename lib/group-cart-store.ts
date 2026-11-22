import 'server-only';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import type { CartItem } from '@/lib/cart';
import type { SiteContent } from '@/lib/content-types';
import { refreshCart } from '@/lib/cart-share';
import { getPool, hasDatabaseConfig } from '@/lib/order-store';
export type GroupCart = { token: string; items: CartItem[]; revision: number; expiresAt: string; applied?: string[] };
export type GroupOperation = { id: string; delta?: number; remove?: boolean; item?: CartItem };
const dir = path.resolve(/* turbopackIgnore: true */ process.env.MUNCHY_LOCAL_DATA_DIR || path.join(process.cwd(), '.data'));
const file = path.join(dir, 'group-carts.json');
let queue: Promise<unknown> = Promise.resolve();
function configured() { if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('Configure the production database.'); }
async function readLocal(): Promise<GroupCart[]> { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; } }
async function localMutation<T>(work: (groups: GroupCart[]) => T): Promise<T> {
  const next = queue.then(async () => { const groups = (await readLocal()).filter(g => Date.parse(g.expiresAt) > Date.now()); const result = work(groups); await mkdir(dir, { recursive: true }); await writeFile(`${file}.tmp`, JSON.stringify(groups)); await rename(`${file}.tmp`, file); return result; });
  queue = next.catch(() => undefined); return next;
}
export function canonicalGroupItems(input: unknown, content: SiteContent): CartItem[] {
  if (!Array.isArray(input) || input.length > 20) throw new Error('A group bag can hold up to 20 different items.');
  for (const item of input) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[a-z0-9-]{1,120}$/.test(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10 || (item.kitchenNotes !== undefined && (typeof item.kitchenNotes !== 'string' || item.kitchenNotes.length > 240)) || (item.spice !== undefined && !['mild', 'house', 'hot'].includes(item.spice))) throw new Error('One or more group items are invalid.');
    const productId = item.productId || item.id;
    if (!item.id.startsWith('custom-box-') && (typeof productId !== 'string' || (item.id !== productId && !item.id.startsWith(`${productId}--`)))) throw new Error('Invalid product variant.');
  }
  if (new Set(input.map(item => item.id)).size !== input.length) throw new Error('Group item IDs must be unique.');
  const items = refreshCart(input as CartItem[], content);
  if (items.length !== input.length) throw new Error('A group item is no longer available. Refresh the menu.');
  // Copy only cart fields. Never persist arbitrary input fields or supplied prices.
  return items.map(item => ({ id: item.id, productId: item.productId, selections: item.selections, quantity: item.quantity, name: item.name, price: item.price, image: item.image, kitchenNotes: item.kitchenNotes || '', spice: item.spice || 'house', customization: item.customization }));
}
export async function createGroup(group: GroupCart) {
  configured();
  if (hasDatabaseConfig()) await getPool().execute('INSERT INTO munchy_group_carts (token, payload, revision, expires_at) VALUES (?, ?, 1, ?)', [group.token, JSON.stringify({ items: group.items, applied: [] }), new Date(group.expiresAt)]);
  else await localMutation(groups => { if (groups.length >= 1000) throw new Error('Please try again later.'); groups.unshift(group); });
}
export async function readGroup(token: string): Promise<GroupCart | null> {
  configured();
  if (!hasDatabaseConfig()) return (await readLocal()).find(g => g.token === token && Date.parse(g.expiresAt) > Date.now()) || null;
  const [rows] = await getPool().execute('SELECT * FROM munchy_group_carts WHERE token = ? AND expires_at > UTC_TIMESTAMP()', [token]);
  const row = (rows as Array<{ payload: string; revision: number; expires_at: Date }>)[0];
  return row ? { token, ...JSON.parse(row.payload), revision: row.revision, expiresAt: row.expires_at.toISOString() } : null;
}
function apply(group: GroupCart, operations: GroupOperation[], content: SiteContent) {
  let items = [...group.items];
  for (const op of operations) {
    if (!op || typeof op.id !== 'string') throw new Error('Invalid group operation.');
    if (op.remove === true) { items = items.filter(i => i.id !== op.id); continue; }
    if (!Number.isInteger(op.delta) || !op.delta || Math.abs(op.delta!) > 10) throw new Error('Invalid quantity change.');
    const existing = items.find(i => i.id === op.id);
    if (existing) {
      const quantity = existing.quantity + op.delta!;
      items = quantity <= 0 ? items.filter(i => i.id !== op.id) : items.map(i => i.id === op.id ? { ...i, quantity: Math.min(10, quantity) } : i);
    } else if (op.delta! > 0 && op.item && op.item.id === op.id) items.push({ ...op.item, quantity: op.delta! });
  }
  group.items = canonicalGroupItems(items, content); group.revision++; return group;
}
export async function changeGroup(token: string, operations: GroupOperation[], content: SiteContent, operationId: string) {
  configured();
  const applyOnce = (group: GroupCart) => { if (group.applied?.includes(operationId)) return group; apply(group, operations, content); group.applied = [...(group.applied || []), operationId].slice(-1000); return group; };
  if (!hasDatabaseConfig()) return localMutation(groups => { const group = groups.find(g => g.token === token); return group ? applyOnce(group) : null; });
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT * FROM munchy_group_carts WHERE token = ? AND expires_at > UTC_TIMESTAMP() FOR UPDATE', [token]);
    const row = (rows as Array<{ payload: string; revision: number; expires_at: Date }>)[0];
    if (!row) { await connection.rollback(); return null; }
    const group = applyOnce({ token, ...JSON.parse(row.payload), revision: row.revision, expiresAt: row.expires_at.toISOString() });
    await connection.execute('UPDATE munchy_group_carts SET payload = ?, revision = ? WHERE token = ?', [JSON.stringify({ items: group.items, applied: group.applied }), group.revision, token]);
    await connection.commit(); return group;
  } catch (e) { await connection.rollback(); throw e; }
  finally { connection.release(); }
}

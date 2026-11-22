import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2';
import type { Pool } from 'mysql2/promise';

export type OrderStatus = 'received' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
export type OrderLine = { id: string; name: string; quantity: number; unitPrice: number; kitchenNotes?: string; spice?: 'mild' | 'house' | 'hot'; customization?: Array<{ key: string; option: string; quantity?: number }> };
export type OrderRecord = {
  code: string;
  name: string;
  phone: string;
  address: string;
  locationUrl?: string;
  items: OrderLine[];
  fulfillment: 'delivery' | 'pickup';
  payment: 'cash_on_delivery';
  changeFor: 'exact' | '100' | '200';
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

let pool: Pool | undefined;
let fileQueue: Promise<unknown> = Promise.resolve();
const localDirectory = path.resolve(/* turbopackIgnore: true */ process.env.MUNCHY_LOCAL_DATA_DIR || path.join(process.cwd(), '.data'));
const localFile = path.join(localDirectory, 'orders.json');
const localCateringFile = path.join(localDirectory, 'catering.json');

export type CateringLead = { id: string; name: string; phone: string; email: string; eventType: string; eventDate: string; guests: number; note: string; createdAt: string };

export function hasDatabaseConfig() {
  if (process.env.MUNCHY_FORCE_LOCAL_DATA === '1') return false;
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
}

export function getPool() {
  if (!pool) {
    const corePool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 5,
    waitForConnections: true,
    queueLimit: 20,
    charset: 'utf8mb4',
    timezone: 'Z',
    });
    corePool.on('connection', connection => {
      connection.query("SET time_zone = '+00:00'", error => { if (error) connection.destroy(); });
    });
    pool = corePool.promise();
  }
  return pool;
}

async function readLocal(): Promise<OrderRecord[]> {
  try { return JSON.parse(await readFile(localFile, 'utf8')) as OrderRecord[]; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}

function serializeLocal<T>(work: () => Promise<T>): Promise<T> {
  const next = fileQueue.then(work, work);
  fileQueue = next.then(() => undefined, () => undefined);
  return next;
}

export async function createOrder(order: OrderRecord) {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    await getPool().execute(
      `INSERT INTO munchy_orders (order_code, customer_name, customer_phone, delivery_address, location_url, items_json, fulfillment_method, payment_method, change_for, subtotal, delivery_fee, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.code, order.name, order.phone, order.address, order.locationUrl || null, JSON.stringify(order.items), order.fulfillment, order.payment, order.changeFor, order.subtotal, order.deliveryFee, order.total, order.status, new Date(order.createdAt)],
    );
    return;
  }
  await serializeLocal(async () => {
    await mkdir(path.dirname(localFile), { recursive: true });
    const orders = await readLocal();
    orders.unshift(order);
    const tempFile = `${localFile}.tmp`;
    await writeFile(tempFile, JSON.stringify(orders, null, 2), 'utf8');
    await rename(tempFile, localFile);
  });
}

function fromRow(row: Record<string, unknown>): OrderRecord {
  return {
    code: String(row.order_code), name: String(row.customer_name), phone: String(row.customer_phone), address: String(row.delivery_address),
    locationUrl: row.location_url ? String(row.location_url) : undefined,
    items: (typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json) as OrderLine[],
    fulfillment: row.fulfillment_method as OrderRecord['fulfillment'], payment: 'cash_on_delivery', changeFor: row.change_for as OrderRecord['changeFor'],
    subtotal: Number(row.subtotal), deliveryFee: Number(row.delivery_fee), total: Number(row.total), status: row.status as OrderStatus,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function listOrders(): Promise<OrderRecord[]> {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    const [rows] = await getPool().query('SELECT * FROM munchy_orders ORDER BY created_at DESC LIMIT 200');
    return (rows as Record<string, unknown>[]).map(fromRow);
  }
  return readLocal();
}

export async function findOrder(code: string): Promise<OrderRecord | undefined> {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    const [rows] = await getPool().execute('SELECT * FROM munchy_orders WHERE order_code = ? LIMIT 1', [code]);
    const row = (rows as Record<string, unknown>[])[0];
    return row ? fromRow(row) : undefined;
  }
  return (await readLocal()).find((order) => order.code === code);
}

export async function updateOrderStatus(code: string, status: OrderStatus) {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    const [result] = await getPool().execute('UPDATE munchy_orders SET status = ? WHERE order_code = ?', [status, code]);
    return (result as { affectedRows: number }).affectedRows > 0;
  }
  return serializeLocal(async () => {
    const orders = await readLocal();
    const index = orders.findIndex((order) => order.code === code);
    if (index < 0) return false;
    orders[index] = { ...orders[index], status };
    await writeFile(`${localFile}.tmp`, JSON.stringify(orders, null, 2), 'utf8');
    await rename(`${localFile}.tmp`, localFile);
    return true;
  });
}

export async function createCateringLead(lead: CateringLead) {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    await getPool().execute(
      'INSERT INTO munchy_catering_leads (lead_id, customer_name, customer_phone, customer_email, event_type, event_date, guest_count, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lead.id, lead.name, lead.phone, lead.email, lead.eventType, lead.eventDate || null, lead.guests, lead.note, new Date(lead.createdAt)],
    );
    return;
  }
  await serializeLocal(async () => {
    await mkdir(path.dirname(localCateringFile), { recursive: true });
    let leads: CateringLead[] = [];
    try { leads = JSON.parse(await readFile(localCateringFile, 'utf8')) as CateringLead[]; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    leads.unshift(lead);
    await writeFile(`${localCateringFile}.tmp`, JSON.stringify(leads, null, 2), 'utf8');
    await rename(`${localCateringFile}.tmp`, localCateringFile);
  });
}

export async function listCateringLeads(): Promise<CateringLead[]> {
  if (process.env.NODE_ENV === 'production' && !hasDatabaseConfig()) throw new Error('ORDER_DATABASE_NOT_CONFIGURED');
  if (hasDatabaseConfig()) {
    const [rows] = await getPool().query('SELECT * FROM munchy_catering_leads ORDER BY created_at DESC LIMIT 200');
    return (rows as Array<Record<string, unknown>>).map((row) => ({ id: String(row.lead_id), name: String(row.customer_name), phone: String(row.customer_phone), email: String(row.customer_email || ''), eventType: String(row.event_type), eventDate: row.event_date ? String(row.event_date).slice(0, 10) : '', guests: Number(row.guest_count), note: String(row.note || ''), createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at) }));
  }
  try { return JSON.parse(await readFile(localCateringFile, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}

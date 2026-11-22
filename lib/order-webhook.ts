import 'server-only';
import { createHmac } from 'node:crypto';
import type { OrderRecord } from '@/lib/order-store';
import { findOrder } from '@/lib/order-store';

export function webhookConfigured() { return Boolean(process.env.ORDER_WEBHOOK_URL && process.env.ORDER_WEBHOOK_SECRET); }
export async function deliverOrderWebhook(order: OrderRecord) {
  if (!webhookConfigured()) return { delivered: false, configured: false };
  const url = new URL(process.env.ORDER_WEBHOOK_URL!);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Webhook requires HTTPS');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify({ event: 'order.received', version: 1, id: order.code, currency: 'MAD', order });
  const signature = createHmac('sha256', process.env.ORDER_WEBHOOK_SECRET!).update(`${timestamp}.${payload}`).digest('hex');
  const response = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json', 'X-Munchy-Timestamp': timestamp, 'X-Munchy-Signature': `sha256=${signature}`, 'Idempotency-Key': order.code }, body: payload });
  if (!response.ok) throw new Error('Webhook receiver rejected delivery');
  return { delivered: true, configured: true };
}
export async function retryOrderWebhook(code: string) {
  const order = await findOrder(code);
  if (!order) return null;
  return deliverOrderWebhook(order);
}

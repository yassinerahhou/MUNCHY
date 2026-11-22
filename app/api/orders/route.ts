import { resolveSelections } from '@/lib/product-options';
import { deliveryQuote, isPeak } from '@/lib/hospitality';
import { sameOrigin } from '@/lib/request-origin';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { deliverOrderWebhook, webhookConfigured } from '@/lib/order-webhook';
import { initialContent as en, type SiteContent } from '@/lib/content-types';
import { readSiteContent } from '@/lib/site-content';
import { createOrder, findOrder, type OrderLine, type OrderRecord } from '@/lib/order-store';

const FREE_DELIVERY_FROM = 100;
const DELIVERY_FEE = 15;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
type Key = keyof typeof en.builderOptions;

function limited(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt <= now) { rateLimits.set(ip, { count: 1, resetAt: now + 60_000 }); return false; }
  entry.count += 1;
  return entry.count > 12;
}


function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

function normalizePhone(value: unknown) {
  const digits = String(value ?? '').replace(/[\s()+-]/g, '');
  const number = digits.startsWith('212') ? `+${digits}` : `+212${digits}`;
  return /^\+212[67]\d{8}$/.test(number) ? number : null;
}

function normalizedLines(input: unknown, en: SiteContent): OrderLine[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) return null;
  const products = new Map<string, (typeof en.products)[number]>(en.products.filter((product) => product.available !== false).map((product) => [product.id, product]));
  const lines: OrderLine[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return null;
    const entry = raw as { id?: unknown; quantity?: unknown; productId?: unknown; selections?: unknown; customization?: unknown; kitchenNotes?: unknown; spice?: unknown };
    const kitchenNotes = String(entry.kitchenNotes || '').trim();
    const spice = entry.spice === undefined ? 'house' : entry.spice;
    if (kitchenNotes.length > 240 || !['mild', 'house', 'hot'].includes(String(spice))) return null;
    const id = String(entry.id ?? '');
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return null;
    if (id.startsWith('custom-box-')) {
      if (!Array.isArray(entry.customization) || entry.customization.length < 3 || entry.customization.length > 4) return null;
      const seen = new Set<string>();
      const customization: Array<{ key: string; option: string }> = [];
      let unitPrice = 0;
      for (const item of entry.customization) {
        if (!item || typeof item !== 'object') return null;
        const selection = item as { key?: unknown; option?: unknown };
        const key = String(selection.key ?? '') as Key;
        const optionName = String(selection.option ?? '');
      if (!Object.hasOwn(en.builderOptions, key) || seen.has(key)) return null;
        const option = en.builderOptions[key as Key].find((candidate) => candidate.name === optionName);
        if (!option) return null;
        seen.add(key); customization.push({ key, option: option.name }); unitPrice += option.price;
      }
      if (!seen.has('base') || !seen.has('protein') || !seen.has('sauce')) return null;
      const name = customization.map((item) => item.option).join(' · ');
      lines.push({ id, name: `Build your box · ${name}`, quantity, unitPrice, customization });
      continue;
    }
    const productId = entry.productId === undefined ? id : String(entry.productId);
    if (id !== productId && !id.startsWith(`${productId}--`)) return null;
    const product = products.get(productId);
    if (!product) return null;
    const options = resolveSelections(product, entry.selections, en.mealOptions);
    if (!options) return null;
    lines.push({ id, name: product.name + (options.summary ? ` · ${options.summary}` : '') + (spice !== 'house' ? ` · ${spice}` : '') + (kitchenNotes ? ` · Kitchen note: ${kitchenNotes}` : ''), quantity, unitPrice: product.price + options.extra, customization: options.selections, kitchenNotes, spice: spice as 'mild' | 'house' | 'hot' });
  }
  return lines;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail('This order could not be submitted from this origin.', 403);
  if (limited(request)) return fail('Too many order attempts. Please try again in a minute.', 429);
  let body: unknown;
  try { body = await request.json(); } catch { return fail('Please send a valid order.'); }
  if (!body || typeof body !== 'object') return fail('Please check your order details.');
  const data = body as Record<string, unknown>;
  const name = String(data.name ?? '').trim();
  const phone = normalizePhone(data.phone);
  const address = String(data.address ?? '').trim();
  const fulfillment = data.fulfillment === 'pickup' ? 'pickup' : 'delivery';
  const changeFor = ['100', '200'].includes(String(data.changeFor)) ? String(data.changeFor) as '100' | '200' : 'exact';
  if (name.length < 2 || name.length > 80) return fail('Enter a name between 2 and 80 characters.');
  if (!phone) return fail('Enter a valid Moroccan mobile number.');
  if (fulfillment === 'delivery' && (address.length < 6 || address.length > 240)) return fail('Enter a complete delivery address.');
  if (fulfillment === 'pickup' && address.length > 240) return fail('The pickup note is too long.');
  const locationUrl = typeof data.locationUrl === 'string' ? data.locationUrl : '';
  if (locationUrl) {
    try { if (new URL(locationUrl).hostname !== 'maps.google.com') return fail('The shared map link is not valid.'); }
    catch { return fail('The shared map link is not valid.'); }
  }
  if (data.redeemPoints) return fail('Online reward redemption is not enabled. Please contact the kitchen.');
  let en: SiteContent;
  try { ({ content: en } = await readSiteContent()); }
  catch { return fail('Ordering is temporarily unavailable. Please try again shortly.', 503); }
  const items = normalizedLines(data.items, en);
  if (!items) return fail('One or more menu items could not be verified. Refresh the menu and try again.');
  const subtotal = items.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  let pin: { lat: number; lng: number } | null = null;
  if (locationUrl) {
    const coordinates = new URL(locationUrl).searchParams.get('q')?.split(',').map(Number);
    if (!coordinates || coordinates.length !== 2 || coordinates.some(n => !Number.isFinite(n)) || Math.abs(coordinates[0]) > 90 || Math.abs(coordinates[1]) > 180) return fail('The location coordinates are invalid.');
    pin = { lat: coordinates[0], lng: coordinates[1] };
  }
  const quote = deliveryQuote(pin, subtotal, en.contact);
  if (fulfillment === 'delivery' && quote.configured && !pin) return fail('Share a location pin to check delivery, or choose pickup.');
  if (fulfillment === 'delivery' && quote.outside) return fail('This address is outside our delivery area. Choose pickup or contact the kitchen.');
  const deliveryFee = fulfillment === 'pickup' ? 0 : quote.fee;
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  let code = '';
  try {
    do { code = `MC-${randomBytes(3).toString('hex').toUpperCase()}`; } while (await findOrder(code));
  } catch { return fail('Ordering is temporarily unavailable. Please try again shortly.', 503); }
  const order: OrderRecord = {
    code, name, phone, address: address || 'Pickup at Munchy Kitchen', locationUrl: locationUrl || undefined,
    items, fulfillment, payment: 'cash_on_delivery', changeFor, subtotal, deliveryFee, total,
    status: 'received', createdAt: new Date().toISOString(),
  };
  try { await createOrder(order); }
  catch (error) {
    console.error('Order storage unavailable:', error instanceof Error ? error.message : 'unknown error');
    return fail('Ordering is temporarily unavailable. Please call the kitchen and try again shortly.', 503);
  }
  const details = items.map((item) => `• ${item.quantity} × ${item.name} — ${item.unitPrice * item.quantity} DH`).join('\n');
  if (webhookConfigured()) after(async () => {
    try { await deliverOrderWebhook(order); }
    catch { console.error(`Order webhook failed for ${order.code}; retry from the admin desk.`); }
  });
  const discountLine = discount > 0 ? `\nClub Munchy Reward: -${discount} DH` : '';
  const message = `Hi Munchy! Please confirm order ${code}.\n\n${details}\n\n${en.cart.subtotal}: ${subtotal} DH\n${en.cart.delivery}: ${deliveryFee ? `${deliveryFee} DH` : 'FREE'}${discountLine}\n${en.cart.total}: ${order.total} DH\n\nName: ${name}\nPhone: ${phone}\n${fulfillment === 'delivery' ? `Address: ${order.address}${locationUrl ? `\nMap: ${locationUrl}` : ''}` : 'Pickup from the Munchy kitchen'}\nCash on delivery${changeFor === 'exact' ? '' : `, change from ${changeFor} DH`}.`;
  const whatsappNumber = (process.env.MUNCHY_WHATSAPP_NUMBER || en.contact.phone).replace(/\D/g, '');
  const waBase = whatsappNumber ? `https://wa.me/${whatsappNumber}` : 'https://wa.me/';
  return NextResponse.json({ orderCode: code, status: order.status, subtotal, deliveryFee, total: order.total, extraPrepMinutes: isPeak() ? 15 : 0, pointsEarned: Math.floor(subtotal / 10) * 10, whatsappUrl: `${waBase}?text=${encodeURIComponent(message)}` }, { status: 201 });
}

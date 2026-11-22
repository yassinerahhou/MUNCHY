import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/request-origin';
import { saveRequest } from '@/lib/hospitality-store';
import { casaDate, timeSlots, reservationZones, occasions, type HospitalityRequest, type RequestKind } from '@/lib/hospitality';
import { readSiteContent } from '@/lib/site-content';

const attempts = new Map<string, { count: number; until: number }>();
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail('Invalid request origin.', 403);
  const now = Date.now();
  for (const [ip, value] of attempts) if (value.until < now) attempts.delete(ip);
  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0];
  const limit = attempts.get(ip) || { count: 0, until: now + 60_000 };
  limit.count++; attempts.set(ip, limit);
  if (limit.count > 10) return fail('Please wait a minute before trying again.', 429);
  let data: Record<string, unknown>;
  try {
    const text = await request.text(); if (text.length > 8000) return fail('Request is too large.', 413);
    data = JSON.parse(text); if (!data || Array.isArray(data) || typeof data !== 'object') return fail('Check your details.');
  } catch { return fail('Check your details.'); }
  if (data.website) return fail('Please try again.');
  const kind = String(data.kind) as RequestKind;
  if (!['reservation', 'gift', 'feedback', 'club'].includes(kind)) return fail('Choose a valid request type.');
  const name = String(data.name || '').trim(), email = String(data.email || '').trim();
  const digits = String(data.phone || '').replace(/[\s()+-]/g, '').replace(/^0/, '');
  const phone = digits.startsWith('212') ? `+${digits}` : `+212${digits}`;
  if (name.length < 2 || name.length > 80) return fail('Enter your name (2–80 characters).');
  if (!/^\+212[67]\d{8}$/.test(phone)) return fail('Enter a Moroccan mobile number.');
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 160)) return fail('Check your email.');
  const details: HospitalityRequest['details'] = {};
  if (kind === 'reservation') {
    const date = String(data.date), time = String(data.time), guests = Number(data.guests), zone = String(data.zone), occasion = String(data.occasion);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date || date <= casaDate() || Date.parse(date) - Date.now() > 90 * 86400000) return fail('Choose a date from tomorrow to 90 days ahead. Contact us for today.');
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) return fail('For more than 12 guests, use catering.');
    if (!(reservationZones as readonly string[]).includes(zone) || !(occasions as readonly string[]).includes(occasion)) return fail('Choose your seating and occasion.');
    try { const { content } = await readSiteContent(); if (!timeSlots(date, content.contact.hours).includes(time)) return fail('Choose a time within published opening hours.'); }
    catch { return fail('Booking is temporarily unavailable.', 503); }
    Object.assign(details, { date, time, guests, zone, occasion });
  }
  if (kind === 'gift') {
    const amount = Number(data.amount), recipient = String(data.recipient || '').trim(), message = String(data.message || '').trim();
    if (![100, 200, 300, 500].includes(amount) || recipient.length < 2 || recipient.length > 80 || message.length > 240) return fail('Check the gift amount, recipient and message.');
    Object.assign(details, { amount, recipient, message, payment: 'unpaid', redeemable: false });
  }
  if (kind === 'feedback') {
    const rating = Number(data.rating), message = String(data.message || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 5 || message.length > 1500) return fail('Choose a rating and add 5–1500 characters of feedback.');
    Object.assign(details, { rating, message });
  }
  if (kind === 'club') {
    if (data.consent !== true) return fail('Consent is required to join.');
    Object.assign(details, { consent: true, consentVersion: 'munchy-club-v1', offer: 'First notice of new dishes; no guaranteed reward' });
  }
  const id = `MH-${randomBytes(8).toString('hex').toUpperCase()}`;
  try { await saveRequest({ id, kind, status: 'new', name, phone, email, details, createdAt: new Date().toISOString() }); }
  catch { return fail('We could not save your request. Please try again shortly.', 503); }
  return NextResponse.json({ reference: id, status: 'request_received', kind }, { status: 201 });
}

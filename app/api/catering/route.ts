import { sameOrigin } from '@/lib/request-origin';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createCateringLead } from '@/lib/order-store';

function bad(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return bad('Invalid request origin.', 403);
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return bad('Please complete the catering form.'); }
  if (String(input.companyWebsite ?? '').trim()) return NextResponse.json({ received: true }, { status: 201 });
  const name = String(input.name ?? '').trim();
  const digits = String(input.phone ?? '').replace(/[\s()+-]/g, '');
  const phone = digits.startsWith('212') ? `+${digits}` : `+212${digits}`;
  const email = String(input.email ?? '').trim();
  const eventType = String(input.eventType ?? '').trim();
  const eventDate = String(input.eventDate ?? '').trim();
  const guests = Number(input.guests);
  const note = String(input.note ?? '').trim();
  if (name.length < 2 || name.length > 80) return bad('Please enter your name.');
  if (!/^\+212[67]\d{8}$/.test(phone)) return bad('Please enter a valid Moroccan mobile number.');
  if (email && (email.length > 160 || !/^\S+@\S+\.\S+$/.test(email))) return bad('Please check the email address.');
  if (!['Office lunch', 'Birthday', 'Private event', 'Other'].includes(eventType)) return bad('Choose an event type.');
  if (!Number.isInteger(guests) || guests < 5 || guests > 300) return bad('Guest count must be between 5 and 300.');
  if (eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || new Date(`${eventDate}T00:00:00`) < new Date(new Date().toDateString()))) return bad('Choose a date in the future.');
  if (note.length > 1000) return bad('Please keep your notes under 1,000 characters.');
  try {
    await createCateringLead({ id: randomUUID(), name, phone, email, eventType, eventDate, guests, note, createdAt: new Date().toISOString() });
    return NextResponse.json({ received: true });
  } catch { return bad('We couldn’t save that request. Please try again shortly.', 503); }
}

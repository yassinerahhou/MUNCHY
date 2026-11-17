import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { listCateringLeads } from '@/lib/order-store';
export async function GET() {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in to view enquiries.' }, { status: 401 });
  try { return NextResponse.json({ leads: await listCateringLeads() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Catering inbox is unavailable.' }, { status: 503 }); }
}

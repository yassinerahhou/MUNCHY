import { sameOrigin } from '@/lib/request-origin';
import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, hasAdminSession, setAdminSession, validAdminPassword } from '@/lib/admin-session';

export async function GET() { return NextResponse.json({ authenticated: await hasAdminSession() }); }

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  let input: { password?: string };
  try { input = await request.json(); } catch { return NextResponse.json({ error: 'Enter your admin password.' }, { status: 400 }); }
  if (!validAdminPassword(String(input.password ?? ''))) return NextResponse.json({ error: 'That password did not match.' }, { status: 401 });
  await setAdminSession();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE(request: NextRequest) { if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 }); await clearAdminSession(); return NextResponse.json({ authenticated: false }); }

import { sameOrigin } from '@/lib/request-origin';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { hasAdminSession } from '@/lib/admin-session';
import { saveMedia } from '@/lib/media-store';
export async function POST(request: NextRequest) {
  if (!await hasAdminSession()) return NextResponse.json({ error: 'Sign in before uploading.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 8_500_000) return NextResponse.json({ error: 'Choose an image under 8 MB.' }, { status: 413 });
  try {
    const form = await request.formData(); const file = form.get('image');
    if (!(file instanceof File) || file.size > 8_000_000 || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Upload a JPG, PNG, WebP or AVIF under 8 MB.');
    const data = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 }).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const id = randomUUID(); await saveMedia(id, data);
    return NextResponse.json({ image: `/api/media/${id}`, bytes: data.length }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Image upload failed.' }, { status: 400 }); }
}

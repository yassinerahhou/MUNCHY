import { readMedia } from '@/lib/media-store';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const data = await readMedia(id);
  if (!data) return new Response('Image not found', { status: 404 });
  return new Response(new Uint8Array(data), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}

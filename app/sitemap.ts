import type { MetadataRoute } from 'next';
import { readSiteContent } from '@/lib/site-content';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL;
  if (!base) return [];
  const { content } = await readSiteContent();
  return ['/', '/menu', '/story', '/catering', '/reserve', '/help', ...content.products.filter(p => p.available !== false).map(p => `/menu/${p.id}`)].map(path => ({ url: new URL(path, base).href }));
}

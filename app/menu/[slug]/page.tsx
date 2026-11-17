import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/product-detail';
import { PageShell } from '@/components/site-chrome';
import { readSiteContent } from '@/lib/site-content';

type Props = { params: Promise<{ slug: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { content: en } = await readSiteContent();
  const { slug } = await params;
  const product = en.products.find((item) => item.id === slug && item.available !== false);
  return { title: product ? `${product.name} · Menu` : 'Menu item', description: product?.description };
}

export default async function ProductPage({ params }: Props) {
  const { content: en } = await readSiteContent();
  const { slug } = await params;
  const product = en.products.find((item) => item.id === slug && item.available !== false);
  if (!product) notFound();
  const related = en.products.filter((item) => item.available !== false && item.id !== product.id && item.category === product.category).slice(0, 3);
  const fallback = related.length >= 3 ? related : [...related, ...en.products.filter((item) => item.available !== false && item.id !== product.id && !related.some((match) => match.id === item.id)).slice(0, 3 - related.length)];
  return <PageShell><ProductDetail product={product} related={fallback} /></PageShell>;
}

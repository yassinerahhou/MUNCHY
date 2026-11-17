import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Flame, MapPin, Timer } from 'lucide-react';
import { PageShell } from '@/components/site-chrome';
import { readSiteContent } from '@/lib/site-content';

export const metadata: Metadata = { title: 'Our Story', description: 'Meet the Munchy idea: a focused Casablanca kitchen, griddle-hot food and a direct path from our kitchen to your table.' };

export default async function StoryPage() {
  const { content: en } = await readSiteContent();
  return <PageShell><main className="story-page">
    <section className="story-hero"><div className="catalog-breadcrumb"><a href="/">{en.catalog.home}</a><span>/</span><b>{en.nav.story}</b></div><div className="story-hero-copy"><p className="section-label"><span>—</span> {en.story.eyebrow}</p><h1>{en.story.title[0]}<br /><em>{en.story.title[1]}</em></h1><p>{en.story.body}</p><a className="button button-red" href="/menu">Meet the menu <ArrowRight size={16} /></a></div><div className="story-hero-image"><Image src="/images/smash-burger.webp" alt={en.ui.heroImageAlt} fill priority sizes="(max-width: 700px) 90vw, 48vw" quality={82} /><span>{en.story.photoNote}</span></div><div className="story-side-note">A SMALL KITCHEN.<br />A BIG CRAVING.</div></section>
    <section className="story-manifesto"><p className="section-label"><span>01</span> {en.story.manifestoLabel}</p><h2>{en.story.manifesto}</h2><div className="story-copy-columns">{en.story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    <section className="story-values"><div className="page-section-heading"><div><p className="section-label"><span>02</span> {en.story.valuesLabel}</p><h2>{en.story.valuesTitle}</h2></div><p>{en.story.valuesIntro}</p></div><div className="story-value-grid">{en.story.values.map((value, index) => <article key={value.title}><span>0{index + 1}</span>{index === 0 ? <Flame size={22} /> : index === 1 ? <MapPin size={22} /> : <Timer size={22} />}<h3>{value.title}</h3><p>{value.body}</p></article>)}</div></section>
    <section className="story-cta"><div><p className="section-label"><span>03</span> {en.story.endingLabel}</p><h2>{en.story.endingTitle}</h2><p>{en.story.endingBody}</p></div><a className="button button-saffron" href="/menu">Order from Munchy <ArrowRight size={16} /></a></section>
  </main></PageShell>;
}

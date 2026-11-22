'use client';
import { ArrowRight } from 'lucide-react';
import CateringForm from '@/components/catering-form';
import { PageShell } from '@/components/site-chrome';
import { useSiteContent } from '@/components/content-provider';

export default function CateringPage() {
  const en = useSiteContent();
  return <PageShell><main id="main-content" className="editorial-page catering-page">
    <div className="page-hero catering-hero"><p className="section-label"><span>—</span> {en.catering.eyebrow}</p><h1>{en.catering.title[0]}<br /><em>{en.catering.title[1]}</em></h1><p>{en.catering.body}</p><a className="button button-red" href="#catering-form">{en.catering.askButton} <ArrowRight size={17} /></a><div className="page-hero-stamp">GOOD FOOD<br />FOR GOOD<br />PEOPLE.</div></div>
    <section className="catering-package-section"><div className="page-section-heading"><div><p className="section-label"><span>01</span> {en.catering.packagesLabel}</p><h2>{en.catering.packageTitle}</h2></div><p>{en.catering.packageNote}</p></div><div className="catering-packages">{en.catering.packages.map((pack, index) => <article className="catering-package" key={pack.name}><div className="package-number">0{index + 1}</div><span>{pack.size}</span><h3>{pack.name}</h3><p>{pack.description}</p><a href="#catering-form">Plan this spread <ArrowRight size={14} /></a></article>)}</div></section>
    <section className="catering-form-section" id="catering-form"><div className="catering-form-intro"><p className="section-label"><span>02</span> {en.catering.formLabel}</p><h2>{en.catering.formTitle}</h2><p>{en.catering.formBody}</p><div className="catering-assurance"><span>✓</span>{en.catering.replyTime}</div></div><CateringForm /></section>
  </main></PageShell>;
}

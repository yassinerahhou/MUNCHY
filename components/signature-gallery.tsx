'use client';
import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useSiteContent } from '@/components/content-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
import { useExperience } from '@/components/experience-provider';
import FoodImage from '@/components/food-image';
export default function SignatureGallery() {
  const content = useSiteContent(), t = useExperienceCopy(), { openDish } = useExperience();
  const ref = useRef<HTMLElement>(null), track = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  const products = content.products.filter(p => p.available !== false && !['Sides & sips', 'Sauces & extras'].includes(p.category)).slice(0, 6);
  useEffect(() => {
    const update = () => setTravel(Math.max(0, (track.current?.scrollWidth || 0) - window.innerWidth + 64));
    update(); const observer = new ResizeObserver(update); if (track.current) observer.observe(track.current); window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [products.length]);
  return <section ref={ref} className={`signature-journey ${reduced ? 'no-sticky' : ''}`} id="signatures"><div className="signature-sticky"><div className="signature-heading"><div><p className="exp-eyebrow">{t.signatureLabel}</p><h2>{t.signatures}</h2></div><p>{t.swipe}<ArrowUpRight size={22} /></p></div><div className="signature-viewport"><motion.div ref={track} className="signature-track" style={reduced ? undefined : { x }}>{products.map((p, index) => <motion.article className="signature-card" key={p.id}><button className="signature-photo" data-cursor={t.view} onClick={() => openDish(p)}><motion.div layoutId={`dish-image-${p.id}`} className="signature-image"><FoodImage src={p.image} alt={p.name} fill sizes="(max-width:768px) 82vw, 36vw" /></motion.div><span className="signature-number">0{index + 1}</span><span className="signature-caption">{p.ingredients?.slice(0, 2).join(' / ') || p.category}</span></button><div className="signature-card-copy"><div><small>{p.category}</small><h3><button onClick={() => openDish(p)}>{p.name}</button></h3><p>{p.portion || 'Feeds 1'} · {p.price} DH</p></div><button className="signature-add" onClick={() => openDish(p)} aria-label={`${t.customize} ${p.name}`}><Plus size={24} /></button></div></motion.article>)}</motion.div></div></div></section>;
}

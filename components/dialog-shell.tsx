'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useExperienceCopy } from '@/lib/experience-copy';
export default function DialogShell({ children, title, close, sheet = false, className = '' }: { children: ReactNode; title: string; close: () => void; sheet?: boolean; className?: string }) {
  const ref = useRef<HTMLElement>(null), reduced = useReducedMotion();
  const t = useExperienceCopy();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const container = ref.current;
    const focusable = () => Array.from(container?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]') || []).filter(el => !el.hasAttribute('disabled') && el.getClientRects().length);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') { const items = focusable(), first = items[0], last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [close]);
  return <motion.div className={`exp-overlay ${sheet ? 'exp-sheet-overlay' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <motion.section ref={ref} role="dialog" aria-modal="true" aria-label={title} data-lenis-prevent className={`exp-dialog ${sheet ? 'exp-sheet' : ''} ${className}`} initial={{ opacity: 0, y: reduced ? 0 : 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 20 }} transition={{ duration: .22 }}>
      {sheet && <motion.div className="sheet-grip" drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={.7} onDragEnd={(_, info) => { if (info.offset.y > 65 || info.velocity.y > 450) close(); }} aria-hidden="true"><span /></motion.div>}
      <button type="button" className="exp-close" aria-label={t.close} onClick={close}><X size={21} /></button>{children}
    </motion.section>
  </motion.div>;
}

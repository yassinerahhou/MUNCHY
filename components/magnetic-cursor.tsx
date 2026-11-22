'use client';
import { useEffect, useRef } from 'react';
export default function MagneticCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const el = ref.current!;
    const move = (event: PointerEvent) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-cursor], .exp-button, .header-reserve');
      if (!target || target.closest('[role="dialog"]')) { el.style.opacity = '0'; return; }
      el.style.opacity = '1'; el.textContent = target.dataset.cursor || '↗';
      const rect = target.getBoundingClientRect();
      const button = target.matches('.exp-button, .header-reserve');
      const x = button ? event.clientX * .75 + (rect.left + rect.width / 2) * .25 : event.clientX;
      const y = button ? event.clientY * .75 + (rect.top + rect.height / 2) * .25 : event.clientY;
      el.style.transform = `translate3d(${x + 16}px, ${y + 16}px, 0)`;
    };
    const hide = () => { el.style.opacity = '0'; };
    window.addEventListener('pointermove', move); document.addEventListener('pointerleave', hide); window.addEventListener('scroll', hide, { passive: true });
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', hide); window.removeEventListener('scroll', hide); };
  }, []);
  return <div ref={ref} className="magnetic-cursor" aria-hidden="true" />;
}

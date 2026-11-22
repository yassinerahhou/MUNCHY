'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useExperienceCopy } from '@/lib/experience-copy';
import { useExperience } from '@/components/experience-provider';
export default function ClubInvitation() {
  const [visible, setVisible] = useState(false);
  const t = useExperienceCopy(), { openForm } = useExperience();
  useEffect(() => {
    try { if (sessionStorage.getItem('munchy_club_dismissed')) return; } catch { return; }
    let elapsed = false, offered = false;
    const update = () => { if (elapsed && !offered && window.scrollY > 2000 && !document.querySelector('[role="dialog"]')) { offered = true; setVisible(true); } };
    const timer = setTimeout(() => { elapsed = true; update(); }, 30000);
    window.addEventListener('scroll', update, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', update); };
  }, []);
  function dismiss() { setVisible(false); try { sessionStorage.setItem('munchy_club_dismissed', '1'); } catch { /* Optional memory */ } }
  return <AnimatePresence>{visible && <motion.aside className="club-invitation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label={t.clubTitle}><button className="club-dismiss" aria-label={t.close} onClick={dismiss}><X size={16} /></button><p className="exp-eyebrow">THE INSIDE TABLE</p><h3>{t.clubTitle}</h3><p>{t.clubBody}</p><button className="editorial-link" onClick={() => { dismiss(); openForm('club'); }}>{t.club}<ArrowUpRight size={15} /></button></motion.aside>}</AnimatePresence>;
}

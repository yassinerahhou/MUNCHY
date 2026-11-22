'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import type { Product } from '@/lib/content-types';
import type { RequestKind } from '@/lib/hospitality';
import { track } from '@/lib/analytics';
import ExperienceDialogs from '@/components/experience-dialogs';
import { GroupCartSync } from '@/components/group-cart';

type State = { cart: boolean; dish: Product | null; form: RequestKind | null };
const Context = createContext({ openCart: () => {}, openDish: (_: Product) => {}, openForm: (_: RequestKind) => {} });
export const useExperience = () => useContext(Context);
export default function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ cart: false, dish: null, form: null });
  const reduced = useReducedMotion();
  const lenis = useRef<Lenis | null>(null);
  const modal = state.cart || state.dish || state.form;
  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const instance = new Lenis({ autoRaf: true, anchors: true, duration: .8, prevent: node => Boolean(node.closest('[data-lenis-prevent]')) });
    lenis.current = instance;
    return () => { instance.destroy(); lenis.current = null; };
  }, [reduced]);
  useEffect(() => { if (modal) lenis.current?.stop(); else lenis.current?.start(); }, [modal]);
  useEffect(() => {
    const open = () => setState({ cart: true, dish: null, form: null });
    window.addEventListener('munchy:cart', open);
    return () => window.removeEventListener('munchy:cart', open);
  }, []);
  const close = useCallback(() => setState({ cart: false, dish: null, form: null }), []);
  return <MotionConfig reducedMotion="user"><Context.Provider value={{
    openCart: () => setState({ cart: true, dish: null, form: null }),
    openDish: dish => { track('menu_item_view', { item_id: dish.id }); setState({ cart: false, dish, form: null }); },
    openForm: form => { if (form === 'reservation') track('reserve_click'); setState({ cart: false, dish: null, form }); },
  }}><GroupCartSync />{children}<ExperienceDialogs state={state} close={close} /></Context.Provider></MotionConfig>;
}

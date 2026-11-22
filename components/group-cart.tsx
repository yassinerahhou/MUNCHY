'use client';
import { useEffect, useRef, useState } from 'react';
import { Share2, Users, LogOut } from 'lucide-react';
import { useCart, type CartItem } from '@/lib/cart';
import { useSiteContent } from '@/components/content-provider';
import { useLocale } from '@/lib/locale';
import { refreshCart } from '@/lib/cart-share';
import type { GroupCart, GroupOperation } from '@/lib/group-cart-store';
const copy = {
  en: { start: 'Start a live group bag', invite: 'Copy group invite', leave: 'Leave group', note: 'Friends with the link can edit this shared bag for 24 hours. Changes sync about every 4 seconds. One person places the final order.', live: 'Live group bag', synced: 'Up to date', syncing: 'Syncing…', copied: 'Invite copied', preview: 'A friend invited you to a live group bag.', join: 'Join & replace my bag', retry: 'Connection interrupted. Your changes will retry.', leaveNote: 'Leave without changing the shared bag', unavailable: 'This group link is unavailable or expired.' },
  fr: { start: 'Créer un panier de groupe', invite: 'Copier l’invitation', leave: 'Quitter le groupe', note: 'Le lien permet de modifier ce panier pendant 24 h. Synchronisation toutes les 4 secondes environ. Une personne confirme la commande.', live: 'Panier de groupe', synced: 'À jour', syncing: 'Synchronisation…', copied: 'Invitation copiée', preview: 'Un ami vous invite à un panier de groupe.', join: 'Rejoindre et remplacer mon panier', retry: 'Connexion interrompue. Nouvel essai automatique.', leaveNote: 'Quitter sans modifier le panier partagé', unavailable: 'Ce lien est indisponible ou expiré.' },
  ar: { start: 'بدا سلة جماعية مباشرة', invite: 'نسخ دعوة المجموعة', leave: 'خرج من المجموعة', note: 'اللي عندو الرابط يقدر يبدل السلة لمدة 24 ساعة. التحديث كل 4 ثواني تقريبا. شخص واحد كيأكد الطلب النهائي.', live: 'سلة جماعية مباشرة', synced: 'محدّثة', syncing: 'كتتزامن…', copied: 'تنسخ رابط الدعوة', preview: 'صاحبك دعاك لسلة جماعية.', join: 'انضم وبدل سلتي', retry: 'تقطع الاتصال. التغييرات غادي تعاود تتصيفط.', leaveNote: 'خرج بلا ما تبدل سلة المجموعة', unavailable: 'هاد الرابط ما متوفرش أو سالات صلاحيته.' },
};
export function GroupCartSync() {
  const { locale } = useLocale(); const c = useSiteContent();
  const content = useRef(c), language = useRef(locale); content.current = c; language.current = locale;
  useEffect(() => {
    let disposed = false, syncing = false, silent = false;
    let queue: Array<{ token: string; operationId: string; operations: GroupOperation[] }> = [];
    try { queue = JSON.parse(localStorage.getItem('munchy_group_pending') || '[]'); if (!Array.isArray(queue) || queue.length > 100) queue = []; } catch { queue = []; }
    const persist = () => { try { localStorage.setItem('munchy_group_pending', JSON.stringify(queue)); } catch { /* Retry still works in this tab */ } };
    const apply = (group: GroupCart) => { silent = true; useCart.setState({ items: refreshCart(group.items, content.current), groupSync: copy[language.current].synced }); silent = false; };
    async function sync() {
      if (disposed || syncing) return;
      const token = useCart.getState().groupToken; if (!token) return;
      queue = queue.filter(entry => entry.token === token); persist(); syncing = true;
      try {
        if (queue.length) {
          useCart.setState({ groupSync: copy[language.current].syncing });
          while (queue.length && !disposed && useCart.getState().groupToken === token) {
            const entry = queue[0];
            const response = await fetch('/api/group-cart', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
            const data = await response.json();
            if (!response.ok) {
              if (response.status === 404) { useCart.setState({ groupToken: null, groupSync: copy[language.current].unavailable }); queue = []; persist(); return; }
              if (response.status === 400) { queue.shift(); persist(); useCart.setState({ groupSync: data.error }); break; }
              throw new Error();
            }
            queue.shift(); persist();
          }
        }
        if (!queue.length && useCart.getState().groupToken === token) {
          const response = await fetch(`/api/group-cart?token=${token}`, { cache: 'no-store' });
          if (!response.ok) { if (response.status === 404) { useCart.setState({ groupToken: null, groupSync: copy[language.current].unavailable }); return; } throw new Error(); }
          const data = await response.json();
          // Do not overwrite a newer local operation made while GET was in flight.
          if (!disposed && !queue.length && useCart.getState().groupToken === token) apply(data);
        }
      } catch { useCart.setState({ groupSync: copy[language.current].retry }); }
      finally { syncing = false; }
    }
    const unsubscribe = useCart.subscribe((next, previous) => {
      if (silent) return;
      if (next.groupToken !== previous.groupToken) { queue = []; persist(); void sync(); return; }
      if (!next.groupToken || next.items === previous.items) return;
      const operations: GroupOperation[] = [];
      for (const old of previous.items) if (!next.items.some(item => item.id === old.id)) operations.push({ id: old.id, remove: true });
      for (const item of next.items) { const old = previous.items.find(entry => entry.id === item.id); const delta = item.quantity - (old?.quantity || 0); if (delta) operations.push({ id: item.id, delta, item }); }
      if (operations.length) { queue.push({ token: next.groupToken, operationId: crypto.randomUUID(), operations }); persist(); void sync(); }
    });
    void sync(); const timer = setInterval(sync, 4000);
    return () => { disposed = true; clearInterval(timer); unsubscribe(); };
  }, []);
  return null;
}
export function GroupCartControls() {
  const { locale } = useLocale(), t = copy[locale], { items, groupToken, groupSync } = useCart();
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  async function invite() {
    setBusy(true); setMessage('');
    try {
      let token = groupToken;
      if (!token) {
        const response = await fetch('/api/group-cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
        const group = await response.json(); if (!response.ok) throw new Error(group.error);
        token = group.token; useCart.setState({ groupToken: token, groupSync: t.synced });
      }
      const url = new URL('/menu', location.origin); url.hash = `group=${token}`;
      try { await navigator.clipboard.writeText(url.href); setMessage(t.copied); } catch { setMessage(url.href); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="group-controls"><button disabled={busy} onClick={invite}><Users size={16} />{groupToken ? t.invite : t.start}<Share2 size={14} /></button><small>{t.note}</small>{groupToken && <div className="group-live"><span><i />{t.live} · {groupSync}</span><button title={t.leaveNote} onClick={() => useCart.setState({ groupToken: null, groupSync: '' })}><LogOut size={13} />{t.leave}</button></div>}{message && <p role="status">{message}</p>}</div>;
}
export function GroupInvitation() {
  const { locale } = useLocale(), t = copy[locale], content = useSiteContent();
  const [group, setGroup] = useState<GroupCart | null>(null), [error, setError] = useState('');
  useEffect(() => {
    const token = location.hash.startsWith('#group=') ? location.hash.slice(7) : new URLSearchParams(location.search).get('group');
    if (!token || !/^[a-f0-9]{32}$/.test(token) || useCart.getState().groupToken === token) return;
    let active = true;
    fetch(`/api/group-cart?token=${token}`, { cache: 'no-store' }).then(async response => { if (!response.ok) throw new Error(); const data = await response.json(); if (active) setGroup(data); }).catch(() => { if (active) setError(t.unavailable); });
    return () => { active = false; };
  }, [t.unavailable]);
  return group ? <div className="usual-banner"><div><h3>{t.preview}</h3><p>{t.note}</p></div><button onClick={() => { useCart.setState({ items: refreshCart(group.items, content), groupToken: group.token, groupSync: t.synced }); setGroup(null); history.replaceState(null, '', '/menu'); }}>{t.join}</button></div> : error ? <p className="group-link-error">{error}</p> : null;
}

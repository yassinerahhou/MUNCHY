'use client';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCart, type CartItem } from '@/lib/cart';
import { useSiteContent } from '@/components/content-provider';
import { useExperienceCopy } from '@/lib/experience-copy';
import { receiveCart, refreshCart } from '@/lib/cart-share';
import { useExperience } from '@/components/experience-provider';
import { isPeak, serviceWindow } from '@/lib/hospitality';
import { GroupInvitation } from '@/components/group-cart';
export default function MenuMemory() {
  const c = useSiteContent(), t = useExperienceCopy(), { openCart } = useExperience();
  const { lastOrder, replace } = useCart();
  const [ready, setReady] = useState(false), [shared, setShared] = useState<CartItem[]>([]), [period, setPeriod] = useState<'lunch' | 'evening' | 'anytime'>('anytime'), [peak, setPeak] = useState(false);
  useEffect(() => {
    setReady(true); const update = () => { setPeriod(serviceWindow()); setPeak(isPeak()); }; update(); const timer = setInterval(update, 60000);
    if (location.hash.startsWith('#bag=')) setShared(receiveCart(location.hash.slice(5), c));
    return () => clearInterval(timer);
  }, [c]);
  function restore(items: CartItem[]) { replace(refreshCart(items, c)); setShared([]); if (location.hash.startsWith('#bag=')) history.replaceState(null, '', location.pathname); openCart(); }
  const usual = ready ? refreshCart(lastOrder || [], c) : [];
  return <><GroupInvitation /><div className="service-banner"><strong>{t[period]}</strong><small>{peak ? t.peak : `${c.contact.pickupMinutes} min / pickup · ${c.contact.deliveryMinutes} min / delivery`}</small></div>{shared.length > 0 && <div className="usual-banner"><h3>{t.shareImport}</h3><button onClick={() => restore(shared)}>{t.importBag}<ArrowRight size={16} /></button></div>}{usual.length > 0 && <div className="usual-banner"><div><h3>{t.usual}</h3><p>{t.usualBody}</p></div><button onClick={() => restore(usual)}>{t.restore}<ArrowRight size={16} /></button></div>}</>;
}

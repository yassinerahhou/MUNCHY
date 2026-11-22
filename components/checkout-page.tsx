'use client';

import { ArrowLeft, ArrowRight, Check, Crosshair, MapPin, Plus, ShieldCheck, ShoppingBag, Sparkles, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useSiteContent } from '@/components/content-provider';
import { useCart } from '@/lib/cart';

const money = (price: number) => `${price} DH`;
type Confirmation = { code: string; total: number; whatsappUrl: string };

export default function CheckoutPage() {
  const en = useSiteContent();
  const { items, points, changeQuantity, removeItem, earnPoints, clear } = useCart();
  const [hydrated, setHydrated] = useState(false);
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [gps, setGps] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Customer auto-fill state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savedFound, setSavedFound] = useState(false);


  useEffect(() => {
    setHydrated(true);
    try {
      const saved = localStorage.getItem('munchy_customer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setAddress(parsed.address);
        setSavedFound(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = fulfillment === 'pickup' || subtotal >= en.contact.freeDeliveryFrom ? 0 : en.contact.deliveryFee;
  const discount = 0;
  const grandTotal = Math.max(0, subtotal + delivery - discount);

  const shareLocation = () => {
    if (!navigator.geolocation) { setError(en.ui.locationUnavailable); return; }
    setBusy(true); setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setGps(`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`); setBusy(false); },
      () => { setError(en.ui.locationFailed); setBusy(false); },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const rawPhone = String(data.get('phone') || phone).replace(/[\s-]/g, '');
    const cleanPhone = rawPhone.startsWith('+212') ? rawPhone : `+212${rawPhone}`;
    const cleanAddress = String(data.get('address') || address).trim();
    const cleanName = String(data.get('name') || name).trim();
    if (cleanName.length < 2 || (fulfillment === 'delivery' && cleanAddress.length < 6)) {
      setError(en.ui.checkoutError);
      setBusy(false);
      return;
    }
    const changeFor = String(data.get('change') || 'Exact change').match(/100|200/)?.[0] || 'exact';

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
          locationUrl: gps,
          fulfillment,
          changeFor,
          items: items.map(({ id, productId, selections, quantity, customization }) => ({ id, productId, selections, quantity, customization }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || en.ui.orderSubmitError);

      // Save customer info for next time
      try {
        localStorage.setItem('munchy_customer', JSON.stringify({ name: cleanName, phone: cleanPhone.replace('+212', ''), address: cleanAddress }));
      } catch {}

      earnPoints(result.pointsEarned);
      setConfirmation({ code: result.orderCode, total: result.total, whatsappUrl: result.whatsappUrl });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : en.ui.orderSubmitError);
    } finally {
      setBusy(false);
    }
  }

  return <main className="checkout-page">
    <div className="catalog-breadcrumb"><a href="/">{en.catalog.home}</a><span>/</span><a href="/menu">{en.nav.menu}</a><span>/</span><b>{en.cart.checkout}</b></div>
    {confirmation ? (
      <section className="checkout-success">
        <div className="success-mark"><Check size={28} /></div>
        <p className="section-label"><span>—</span> {en.ui.receiptKicker}</p>
        <h1>{en.checkout.title}</h1>
        <p>{en.ui.receiptBody}</p>
        <div className="order-code"><span>{en.ui.orderCodeLabel}</span><strong>{confirmation.code}</strong></div>
        <div className="checkout-success-actions">
          <a className="button button-red" href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer">{en.ui.whatsapp}<ArrowRight size={17} /></a>
          <a className="button button-light" href={`/track?code=${confirmation.code}`}>{en.ui.trackOrder}<ArrowRight size={16} /></a>
        </div>
        <p className="checkout-note">{en.ui.receiptNote}</p>
      </section>
    ) : <>
      <header className="checkout-page-heading">
        <p className="section-label"><span>02</span> MUNCHY CHECKOUT</p>
        <h1>{en.checkout.title}<span>.</span></h1>
        <p>{en.checkout.note}</p>
      </header>
      {!hydrated ? <div className="checkout-loading">{en.ui.loadingOrder}</div> : items.length === 0 ? (
        <div className="checkout-empty">
          <ShoppingBag size={26} />
          <h2>{en.ui.emptyCartTitle}</h2>
          <p>{en.ui.emptyCartBody}</p>
          <a className="button button-red" href="/menu">{en.ui.browseMenu}<ArrowRight size={16} /></a>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-page-form" onSubmit={placeOrder}>
            <section className="checkout-form-section">
              <p className="form-step">01 <span>·</span> {en.ui.handoffLabel}</p>
              <div className="fulfillment-toggle" role="group" aria-label={en.fulfillment.label}>
                <button type="button" className={fulfillment === 'delivery' ? 'fulfillment-choice active' : 'fulfillment-choice'} onClick={() => setFulfillment('delivery')}>
                  <span>{en.fulfillment.delivery}</span>
                  <small>{delivery ? money(delivery) : en.catalog.free}</small>
                </button>
                <button type="button" className={fulfillment === 'pickup' ? 'fulfillment-choice active' : 'fulfillment-choice'} onClick={() => setFulfillment('pickup')}>
                  <span>{en.fulfillment.pickup}</span>
                  <small>{en.contact.pickupMinutes} min</small>
                </button>
              </div>
              {fulfillment === 'pickup' && (
                <p className="pickup-note"><MapPin size={14} />{en.checkout.pickupNote}<br /><b>{en.contact.address}</b></p>
              )}
            </section>

            <section className="checkout-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="form-step">02 <span>·</span> {en.ui.yourDetails}</p>
                {savedFound && <span className="saved-badge" title="Auto-filled from your previous order"><UserCheck size={13} /> Details remembered</span>}
              </div>
              <label>{en.checkout.name}
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={en.ui.namePlaceholder}
                />
              </label>
              <label>{en.checkout.phone}
                <div className="phone-field">
                  <span>+212</span>
                  <input
                    name="phone"
                    autoComplete="tel-national"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder={en.ui.phonePlaceholder}
                    pattern="[67][0-9]{8}"
                    title={en.ui.phoneTitle}
                  />
                </div>
              </label>
              {fulfillment === 'delivery' && <>
                <label>{en.checkout.address}
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    rows={3}
                    required
                    minLength={6}
                    maxLength={240}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={en.ui.addressPlaceholder}
                  />
                </label>
                <button type="button" className={gps ? 'gps-button gps-done' : 'gps-button'} onClick={shareLocation} disabled={busy}>
                  {gps ? <Check size={15} /> : <Crosshair size={15} />}
                  {gps ? en.ui.locationAttached : busy ? en.ui.locationBusy : en.checkout.gps}
                </button>
              </>}
            </section>

            <section className="checkout-form-section">
              <p className="form-step">03 <span>·</span> {en.ui.paymentTitle}</p>
              <div className="payment-choice">
                <span>{en.checkout.payment}</span>
                <div>
                  <span className="cod-icon"><Check size={14} /></span>
                  <b>{en.checkout.cod}</b>
                  <small>{en.fulfillment.driverCash}</small>
                </div>
              </div>
              <label className="change-select">{en.checkout.change}
                <select name="change">{en.ui.changeOptions.map((option) => <option key={option}>{option}</option>)}</select>
              </label>
            </section>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-red checkout-submit" type="submit" disabled={busy}>
              {busy ? en.checkout.sending : en.checkout.confirm}<ArrowRight size={17} />
            </button>
            <p className="secure-note"><ShieldCheck size={15} />{en.ui.orderSecurityNote}</p>
          </form>

          <aside className="checkout-order-card">
            <div className="checkout-order-heading">
              <h2>{en.cart.title}</h2>
              <a href="/menu">{en.ui.editOrder}</a>
            </div>
            <div className="checkout-lines">
              {items.map((item) => (
                <div className="checkout-line" key={item.id}>
                  <div className="checkout-line-image">{item.image && <Image src={item.image} alt="" fill sizes="62px" quality={72} />}</div>
                  <div className="checkout-line-name">
                    <b>{item.name}</b>
                    <small>{money(item.price)} each</small>
                    <div className="quantity-control">
                      <button type="button" aria-label={en.ui.decreaseQuantity} onClick={() => changeQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={en.ui.increaseQuantity} onClick={() => changeQuantity(item.id, 1)}><Plus size={12} /></button>
                    </div>
                  </div>
                  <button className="checkout-remove" type="button" aria-label={en.ui.removeItem.replace('{name}', item.name)} onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
            </div>
            <div className="checkout-totals">
              <div><span>{en.cart.subtotal}</span><b>{money(subtotal)}</b></div>
              <div><span>{en.cart.delivery}</span><b>{delivery ? money(delivery) : en.catalog.free}</b></div>
              {discount > 0 && <div className="discount-line"><span>Munchy Club Reward</span><b>-{money(discount)}</b></div>}
              <div className="summary-total"><span>{en.cart.total}</span><b>{money(grandTotal)}</b></div>
            </div>
            <div className="checkout-reward">
              <span>—</span>{en.ui.pointsSummary.replace('{points}', String(Math.floor(subtotal / 10) * 10))}
            </div>
          </aside>
        </div>
      )}
    </>}
    <a className="back-to-menu checkout-back" href="/menu"><ArrowLeft size={14} />{en.catalog.backToMenu}</a>
  </main>;
}

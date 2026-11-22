'use client';
export type AnalyticsEvent = 'reserve_click' | 'whatsapp_order' | 'menu_item_view' | 'add_to_cart' | 'request_saved';
export function track(event: AnalyticsEvent, data: Record<string, string | number> = {}) {
  window.dispatchEvent(new CustomEvent('munchy:analytics', { detail: { event, ...data } }));
  // External adapters subscribe after the operator has collected analytics consent.
  let consent = false;
  try { consent = localStorage.getItem('munchy_analytics_consent') === 'yes'; } catch { /* Storage may be disabled. */ }
  if (consent) {
    const win = window as Window & { dataLayer?: unknown[] };
    win.dataLayer?.push({ event, ...data });
  }
}

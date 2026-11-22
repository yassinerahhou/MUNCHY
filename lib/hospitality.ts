export type RequestKind = 'reservation' | 'gift' | 'feedback' | 'club';
export type HospitalityRequest = {
  id: string; kind: RequestKind; status: 'new' | 'contacted' | 'closed';
  name: string; phone: string; email: string; details: Record<string, string | number | boolean>; createdAt: string;
};
export const reservationZones = ['Indoor', 'Terrace', 'VIP lounge'] as const;
export const occasions = ['Just because', 'Birthday', 'Anniversary', 'Business'] as const;
export function casaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key)?.value).join('-');
}
export function isPeak(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Casablanca', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value || '';
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  return ['Fri', 'Sat'].includes(part('weekday')) && minutes >= 1200 && minutes < 1350;
}
export function serviceWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const minutes = Number(parts.find(p => p.type === 'hour')?.value) * 60 + Number(parts.find(p => p.type === 'minute')?.value);
  return minutes >= 720 && minutes < 930 ? 'lunch' : minutes >= 1140 ? 'evening' : 'anytime';
}
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (v: number) => v * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function publicDeliveryConfig() {
  const lat = Number(process.env.NEXT_PUBLIC_KITCHEN_LAT), lng = Number(process.env.NEXT_PUBLIC_KITCHEN_LNG), radius = Number(process.env.NEXT_PUBLIC_DELIVERY_RADIUS_KM);
  return process.env.NEXT_PUBLIC_KITCHEN_LAT && process.env.NEXT_PUBLIC_KITCHEN_LNG && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && radius > 0 ? { lat, lng, radius } : null;
}
export function deliveryQuote(pin: { lat: number; lng: number } | null, subtotal: number, contact: { freeDeliveryFrom: number; deliveryFee: number }) {
  const config = publicDeliveryConfig();
  const distance = config && pin ? distanceKm(config, pin) : null;
  const outside = distance !== null && config !== null && distance > config.radius;
  const extra = Number(process.env.NEXT_PUBLIC_DELIVERY_PER_KM || 0);
  const fee = subtotal >= contact.freeDeliveryFrom ? 0 : contact.deliveryFee + (distance !== null && Number.isFinite(extra) && extra > 0 ? Math.ceil(distance) * extra : 0);
  return { distance: distance === null ? null : Math.round(distance * 10) / 10, outside, fee, configured: Boolean(config) };
}
export function timeSlots(date: string, hours: readonly string[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const slots: string[] = [];
  for (let i = 0; i + 1 < hours.length; i += 2) {
    const range = hours[i].toUpperCase().split(/[–—-]/).map(s => week.indexOf(s.trim().slice(0, 3)));
    const start = range[0], end = range.at(-1)!;
    if (range.some(n => n < 0) || !(start <= end ? day >= start && day <= end : day >= start || day <= end)) continue;
    const times = hours[i + 1].match(/^(\d{1,2}):(\d{2})[–—-](\d{1,2}):(\d{2})$/);
    if (!times) continue;
    const open = Number(times[1]) * 60 + Number(times[2]);
    let close = Number(times[3]) * 60 + Number(times[4]);
    if (close <= open) close += 1440;
    for (let m = open; m <= Math.min(close - 60, 1410); m += 30) slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots;
}

export function getBusinessStatus() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const partMap: Record<string, string> = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }
    const weekday = partMap.weekday || '';
    const hour = parseInt(partMap.hour || '0', 10);
    const isWeekend = ['Fri', 'Sat', 'Sun'].includes(weekday);
    const closeHour = isWeekend ? 24 : 23;
    const isOpen = hour >= 12 && hour < closeHour;

    return {
      isOpen,
      badgeText: isOpen ? 'OPEN NOW' : 'OPENS AT 12:00',
      timingText: isOpen ? 'At your door in ~25 min' : 'Pre-order available',
    };
  } catch {
    return {
      isOpen: true,
      badgeText: 'OPEN NOW',
      timingText: 'At your door in ~25 min',
    };
  }
}

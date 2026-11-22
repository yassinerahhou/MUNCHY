const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export function openingHoursSchema(hours: readonly string[]) {
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return Array.from({ length: Math.floor(hours.length / 2) }, (_, index) => {
    const range = hours[index * 2].toUpperCase().split(/[–—-]/).map(value => days.indexOf(value.trim().slice(0, 3)));
    const times = hours[index * 2 + 1].match(/^(\d{2}:\d{2})[–—-](\d{2}:\d{2})$/);
    if (!times || range.some(day => day < 0)) return null;
    const selected = names.filter((_, day) => range[0] <= range.at(-1)! ? day >= range[0] && day <= range.at(-1)! : day >= range[0] || day <= range.at(-1)!);
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: selected, opens: times[1], closes: times[2] };
  }).filter(Boolean);
}

// Admin schedule uses alternating day ranges and HH:mm ranges, in Casablanca time.
export function getBusinessStatus(hours: readonly string[], deliveryMinutes: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Casablanca', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (name: string) => parts.find((entry) => entry.type === name)?.value || '';
  const today = days.indexOf(part('weekday').toUpperCase());
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  let matched = false;
  let isOpen = false;
  let closesAt = '';
  let nextOpening = { offset: 8, time: '' };
  for (let index = 0; index + 1 < hours.length; index += 2) {
    const dayRange = hours[index].toUpperCase().split(/[–—-]/).map((value) => days.indexOf(value.trim().slice(0, 3)));
    const timeRange = hours[index + 1].match(/^(\d{1,2}):(\d{2})[–—-](\d{1,2}):(\d{2})$/);
    if (dayRange.some((day) => day < 0) || !timeRange) continue;
    const start = dayRange[0], end = dayRange.at(-1)!;
    const includes = (day: number) => start <= end ? day >= start && day <= end : day >= start || day <= end;
    const opens = Number(timeRange[1]) * 60 + Number(timeRange[2]);
    const closes = Number(timeRange[3]) * 60 + Number(timeRange[4]);
    matched = true;
    for (let offset = 0; offset < 8; offset++) {
      if (includes((today + offset) % 7) && (offset > 0 || minutes < opens) && offset < nextOpening.offset) nextOpening = { offset, time: `${String(Math.floor(opens / 60)).padStart(2, '0')}:${String(opens % 60).padStart(2, '0')}` };
    }
    if (closes <= opens) {
      const active = (includes(today) && minutes >= opens) || (includes((today + 6) % 7) && minutes < closes);
      if (active) closesAt = `${String(Math.floor(closes / 60)).padStart(2, '0')}:${String(closes % 60).padStart(2, '0')}`;
      isOpen ||= active;
    } else {
      const active = includes(today) && minutes >= opens && minutes < closes;
      if (active) closesAt = `${String(Math.floor(closes / 60)).padStart(2, '0')}:${String(closes % 60).padStart(2, '0')}`;
      isOpen ||= active;
    }
  }
  return {
    isOpen,
    closesAt,
    nextOpening: nextOpening.offset < 8 ? nextOpening : null,
    badgeText: !matched ? 'CHECK OPENING HOURS' : isOpen ? 'OPEN NOW' : 'KITCHEN CLOSED',
    timingText: isOpen ? `Delivery ~${deliveryMinutes} min` : 'Kitchen confirmation required',
  };
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Admin schedule uses alternating day ranges and HH:mm ranges, in Casablanca time.
export function getBusinessStatus(hours: readonly string[], deliveryMinutes: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Casablanca', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (name: string) => parts.find((entry) => entry.type === name)?.value || '';
  const today = days.indexOf(part('weekday').toUpperCase());
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  let matched = false;
  let isOpen = false;
  for (let index = 0; index + 1 < hours.length; index += 2) {
    const dayRange = hours[index].toUpperCase().split(/[–—-]/).map((value) => days.indexOf(value.trim().slice(0, 3)));
    const timeRange = hours[index + 1].match(/^(\d{1,2}):(\d{2})[–—-](\d{1,2}):(\d{2})$/);
    if (dayRange.some((day) => day < 0) || !timeRange) continue;
    const start = dayRange[0], end = dayRange.at(-1)!;
    const includes = (day: number) => start <= end ? day >= start && day <= end : day >= start || day <= end;
    const opens = Number(timeRange[1]) * 60 + Number(timeRange[2]);
    const closes = Number(timeRange[3]) * 60 + Number(timeRange[4]);
    matched = true;
    if (closes <= opens) {
      isOpen ||= (includes(today) && minutes >= opens) || (includes((today + 6) % 7) && minutes < closes);
    } else isOpen ||= includes(today) && minutes >= opens && minutes < closes;
  }
  return {
    isOpen,
    badgeText: !matched ? 'CHECK OPENING HOURS' : isOpen ? 'OPEN NOW' : 'KITCHEN CLOSED',
    timingText: isOpen ? `Delivery ~${deliveryMinutes} min` : 'Kitchen confirmation required',
  };
}

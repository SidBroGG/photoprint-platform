export const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;

const MONTHS_SHORT = [
  "янв.",
  "февр.",
  "март",
  "апр.",
  "май",
  "июнь",
  "июль",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
];

const MONTHS_FULL = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

const WEEKDAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function moscowDayIndex(date: Date): number {
  return Math.floor((date.getTime() + MSK_OFFSET_MS) / DAY_MS);
}

export function dayStart(dayIndex: number): Date {
  return new Date(dayIndex * DAY_MS - MSK_OFFSET_MS);
}

export function moscowDate(dayIndex: number, hour = 12, minute = 0): Date {
  return new Date(dayIndex * DAY_MS - MSK_OFFSET_MS + hour * HOUR_MS + minute * MINUTE_MS);
}

export function startOfToday(now: Date): Date {
  return dayStart(moscowDayIndex(now));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function weekdayIndex(date: Date): number {
  return (moscowDayIndex(date) + 3) % 7;
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[weekdayIndex(date)] ?? "";
}

export function monthKey(date: Date): string {
  const shifted = new Date(date.getTime() + MSK_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthStartOffset(now: Date, monthsAgo: number): Date {
  const shifted = new Date(now.getTime() + MSK_OFFSET_MS);
  const utc = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() - monthsAgo, 1));
  return new Date(utc.getTime() - MSK_OFFSET_MS);
}

export function monthKeysBack(now: Date, count: number): string[] {
  const shifted = new Date(now.getTime() + MSK_OFFSET_MS);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function monthKeyLabel(key: string): string {
  const parts = key.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  return `${MONTHS_SHORT[month - 1] ?? ""} ${String(year).slice(2)}`;
}

export function monthKeyFullLabel(key: string): string {
  const parts = key.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  return `${MONTHS_FULL[month - 1] ?? ""} ${year}`;
}

export function mondayIndex(date: Date): number {
  return moscowDayIndex(date) - weekdayIndex(date);
}

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

export function isSameMoscowDay(a: Date, b: Date): boolean {
  return moscowDayIndex(a) === moscowDayIndex(b);
}

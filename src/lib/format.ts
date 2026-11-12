const moneyFormatter = new Intl.NumberFormat("be-BY", {
  style: "currency",
  currency: "BYN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dayMonthFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(Math.round(value));
}

export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн Br`;
  }
  if (abs >= 10_000) {
    return `${Math.round(value / 1000)} тыс. Br`;
  }
  return formatMoney(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatPercent(ratio: number, digits = 0): string {
  const percent = ratio * 100;
  return `${percent.toFixed(digits).replace(".", ",")}%`;
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

export function formatDayMonth(date: Date): string {
  return dayMonthFormatter.format(date);
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1).replace(".", ",")} ч`;
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

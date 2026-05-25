// All dates handled in Europe/London. We store ISO UTC in SQLite via datetime('now')
// but for "today" calculations we use the local Europe/London date.

const TZ = 'Europe/London';

export function todayIso(): string {
  // YYYY-MM-DD in Europe/London
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export function daysBetween(iso: string | null, nowIso: string = new Date().toISOString()): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const a = new Date(iso).getTime();
  const b = new Date(nowIso).getTime();
  return Math.max(0, (b - a) / 86_400_000);
}

export function humanDaysAgo(iso: string | null): string {
  if (!iso) return 'never';
  const days = Math.floor(daysBetween(iso));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return 'last month';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'last year' : `${years} years ago`;
}

export function daysUntilBirthday(birthdayIso: string | null): number | null {
  if (!birthdayIso) return null;
  // birthday may be 'YYYY-MM-DD' or 'MM-DD'
  const parts = birthdayIso.split('-');
  if (parts.length < 2) return null;
  const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
  const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
  if (!month || !day) return null;

  const now = new Date();
  const yr = now.getFullYear();
  let next = new Date(yr, month - 1, day);
  if (next.getTime() < now.setHours(0, 0, 0, 0)) {
    next = new Date(yr + 1, month - 1, day);
  }
  return Math.ceil((next.getTime() - Date.now()) / 86_400_000);
}

export function isQuietDay(quietDaysCsv: string): boolean {
  if (!quietDaysCsv) return false;
  const days = quietDaysCsv.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const today = new Date().toLocaleString('en-US', { timeZone: TZ, weekday: 'short' });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return days.includes(map[today] ?? -1);
}

export function todayKey(x = new Date()): string {
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const d = (iso: string | Date) => (iso instanceof Date ? iso : new Date(iso));

/** "12 Nov" */
export const dayMonth = (iso: string | Date) => `${d(iso).getDate()} ${MONTHS[d(iso).getMonth()]}`;
/** "Mon 16 Nov" */
export const weekdayDayMonth = (iso: string | Date) => `${DAYS[d(iso).getDay()]} ${dayMonth(iso)}`;
/** "Thursday, 12 Nov" */
export const longWeekday = (iso: string | Date) => `${DAYS_LONG[d(iso).getDay()]}, ${dayMonth(iso)}`;
export const monthName = (iso: string | Date) => MONTHS_LONG[d(iso).getMonth()];
export const shortDay = (iso: string | Date) => DAYS[d(iso).getDay()];

/** "4:30 pm" */
export function time(iso: string | Date): string {
  const x = d(iso);
  const h = x.getHours();
  const m = x.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const start = new Date(d(a).getFullYear(), d(a).getMonth(), d(a).getDate());
  const end = new Date(d(b).getFullYear(), d(b).getMonth(), d(b).getDate());
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** "9:12", "Yest.", "Mon" or "3 Nov" for message lists. */
export function relativeStamp(iso: string, now = new Date()): string {
  const diff = daysBetween(iso, now);
  if (diff <= 0) return time(iso).replace(/ (am|pm)$/, '');
  if (diff === 1) return 'Yest.';
  if (diff < 7) return shortDay(iso);
  return dayMonth(iso);
}

/** "2 h", "5 h", "1 d" since a case arrived. */
export function ageSince(iso: string, now = new Date()): string {
  const hours = Math.max(1, Math.round((now.getTime() - d(iso).getTime()) / 3600000));
  return hours < 24 ? `${hours} h` : `${Math.round(hours / 24)} d`;
}

export const pkr = (n: number) => `PKR ${n.toLocaleString('en-US')}`;

export function firstName(name: string): string {
  return name.replace(/^Dr\.?\s+/i, '').split(' ')[0] ?? name;
}

export function addDays(base: Date, n: number): Date {
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  return x;
}

/** "Dr. Sana Iqbal" -> "Dr. Iqbal" */
export function drShort(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, '').split(/\s+/);
  return /^Dr\.?\s/i.test(name) ? `Dr. ${parts[parts.length - 1]}` : name;
}

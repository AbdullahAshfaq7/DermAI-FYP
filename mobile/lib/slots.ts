import { DEFAULT_AVAILABILITY } from '@/data/seed';
import type { Appointment, Availability } from '@/data/types';
import { addDays, shortDay } from '@/lib/format';

export interface Slot {
  iso: string;
  label: string;
  taken: boolean;
}

function parseClock(s: string): number {
  const m = /(\d+):(\d+)\s*(am|pm)/i.exec(s);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') h += 12;
  return h * 60 + Number(m[2]);
}

export function nextDays(n = 7, from = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

export function isOpen(day: Date, availability: Availability = DEFAULT_AVAILABILITY): boolean {
  return availability.days.find((d) => d.day === shortDay(day))?.open ?? false;
}

/**
 * 30-minute slots inside the doctor's hours (H6 feeds E5).
 * Some are marked taken so the picker looks like a real diary; booked visits are always taken.
 */
export function slotsFor(day: Date, doctorId: string, booked: Appointment[], availability: Availability = DEFAULT_AVAILABILITY): Slot[] {
  const rule = availability.days.find((d) => d.day === shortDay(day));
  if (!rule?.open) return [];
  const start = parseClock(rule.from);
  const end = parseClock(rule.to);
  const now = Date.now() + availability.noticeHours * 3600000;
  const out: Slot[] = [];
  for (let m = start; m + 20 <= end; m += 30) {
    const t = new Date(day);
    t.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const iso = t.toISOString();
    // Roughly one slot in four looks booked; varies by slot, day and doctor.
    const seed = (t.getDate() * 7 + (m / 30) * 3 + doctorId.charCodeAt(3)) % 4;
    const taken =
      t.getTime() < now ||
      seed === 0 ||
      booked.some((a) => a.doctorId === doctorId && a.status === 'upcoming' && Math.abs(new Date(a.start).getTime() - t.getTime()) < 60000);
    const h = Math.floor(m / 60);
    out.push({ iso, label: `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`, taken });
  }
  return out;
}

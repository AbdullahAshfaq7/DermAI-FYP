import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { CONCERNS, ROUTINE_LIBRARY, ZONE_LABEL } from '@/data/seed';
import type { ConcernKey, ConcernLevel, Doctor, Scan, ZoneKey } from '@/data/types';
import { dayMonth, todayKey } from '@/lib/format';
import { buildRoutine } from '@/lib/routine';
import type { AppState } from '@/store/state';

export { todayKey };

export function doctorById(s: AppState, id: string | null | undefined): Doctor | undefined {
  return id ? s.doctors.find((d) => d.id === id) : undefined;
}

/** A doctor's display name even when they are no longer listed (e.g. left DermAI). */
export function doctorName(s: AppState, id: string | null | undefined, fallback = 'Your doctor'): string {
  return doctorById(s, id)?.name ?? fallback;
}

export function scanById(s: AppState, id: string | undefined): Scan | undefined {
  return s.scans.find((x) => x.id === id);
}

export function previousScan(s: AppState, scan: Scan): Scan | undefined {
  const i = s.scans.findIndex((x) => x.id === scan.id);
  return i >= 0 ? s.scans[i + 1] : undefined;
}

export function deltaLine(scan: Scan, prev?: Scan): string {
  if (!prev) return 'Your first scan';
  const d = scan.score - prev.score;
  if (d === 0) return `Same as ${dayMonth(prev.date)}`;
  return `${d > 0 ? 'Up' : 'Down'} ${Math.abs(d)} since ${dayMonth(prev.date)}`;
}

const LEVELS: ConcernLevel[] = ['High', 'Moderate', 'Mild', 'Clear'];

/** ["Moderate: nose, left cheek", ...] grouped from the face map. */
export function zoneSummary(zones: Record<ZoneKey, ConcernLevel>): { level: ConcernLevel; text: string }[] {
  return LEVELS.map((level) => {
    const z = (Object.keys(zones) as ZoneKey[]).filter((k) => zones[k] === level);
    return { level, text: z.length ? `${level}: ${z.map((k) => ZONE_LABEL[k]).join(', ')}` : '' };
  }).filter((x) => x.text);
}

/** Zones for a single concern: where it shows takes its level, the rest read clear. */
export function zonesForConcern(scan: Scan, key: ConcernKey): Record<ZoneKey, ConcernLevel> {
  const where = scan.where[key] ?? [];
  const level = scan.concerns[key].level;
  return {
    forehead: where.includes('forehead') ? level : 'Clear',
    nose: where.includes('nose') ? level : 'Clear',
    leftCheek: where.includes('leftCheek') ? level : 'Clear',
    rightCheek: where.includes('rightCheek') ? level : 'Clear',
    chin: where.includes('chin') ? level : 'Clear',
  };
}

export function whereText(scan: Scan, key: ConcernKey): string {
  const where = scan.where[key] ?? [];
  if (!where.length) return `${CONCERNS[key].label} reads ${scan.concerns[key].level.toLowerCase()} across your face.`;
  const names = where.map((z) => ZONE_LABEL[z]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `Mostly across your ${list}.`;
}

export function trendWord(values: number[]): string {
  if (values.length < 2) return 'first reading';
  const d = values[values.length - 1] - values[0];
  if (d <= -3) return 'easing';
  if (d >= 3) return 'rising';
  return 'steady';
}

export function routineProgress(s: AppState, period: 'am' | 'pm') {
  const steps = buildRoutine(period, s.profile, s.routinePrefs, s.scans[0]);
  const done = (s.routineLog[todayKey()] ?? []).filter((id) => steps.some((x) => x.id === id));
  return { steps, done: done.length, total: steps.length };
}

export function streak(s: AppState): number {
  const am = routineProgress(s, 'am');
  return s.streakBase + (am.total > 0 && am.done === am.total ? 1 : 0);
}

export function nextAppointment(s: AppState) {
  const now = Date.now();
  return s.appointments
    .filter((a) => a.status === 'upcoming' && (a.service === 'message' || new Date(a.start).getTime() > now - 3600000))
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

export function rescanIn(s: AppState): number | null {
  const last = s.scans[0];
  if (!last) return null;
  const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  return s.settings.rescanDays - days;
}

export function stepById(id: string) {
  return ROUTINE_LIBRARY.find((x) => x.id === id);
}

/** Counts a number up once, unless the person prefers reduced motion. */
export function useCountUp(target: number, run: boolean, ms = 700): number {
  const [v, setV] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) return setV(target);
      const start = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / ms);
        setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, run, ms]);
  return run ? v : target;
}


const ZONE_NAME: Record<ZoneKey, string> = { forehead: 'Forehead', nose: 'T-zone', leftCheek: 'Left cheek', rightCheek: 'Right cheek', chin: 'Chin' };
const RANK_L: Record<ConcernLevel, number> = { Clear: 0, Mild: 1, Moderate: 2, High: 3 };

/** Short zone name for map tags and summaries ("T-zone", "Chin"). */
export function zoneName(z: ZoneKey): string {
  return ZONE_NAME[z];
}

/** One line before the map: "Chin and T-zone need the most care. Cheeks are calmer." */
export function summaryLine(scan: Scan): string {
  const zones = (Object.keys(scan.zones) as ZoneKey[]).sort((a, b) => RANK_L[scan.zones[b]] - RANK_L[scan.zones[a]]);
  const top = RANK_L[scan.zones[zones[0]]];
  if (top === 0) return 'Every zone reads clear. Keep doing what you are doing.';
  const worst = zones.filter((z) => RANK_L[scan.zones[z]] === top).map((z) => ZONE_NAME[z]);
  const calm = zones.filter((z) => RANK_L[scan.zones[z]] === 0);
  const join = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1].toLowerCase()}` : xs[0]);
  const cheeks = calm.includes('leftCheek') && calm.includes('rightCheek');
  const calmNames = cheeks ? ['Cheeks', ...calm.filter((z) => z !== 'leftCheek' && z !== 'rightCheek').map((z) => ZONE_NAME[z].toLowerCase())] : calm.map((z) => ZONE_NAME[z]);
  const first = `${join(worst)} ${worst.length > 1 ? 'need' : 'needs'} the most care.`;
  if (!calmNames.length) return first;
  return `${first} ${join(calmNames)} ${calmNames.length > 1 || cheeks ? 'are' : 'is'} calmer.`;
}

/** The photo for a scan: the phone's copy first (phone-first), else a shared server copy. */
export function photoFor(scan: Scan, local: Record<string, { uri: string }>): string | null {
  return local[scan.id]?.uri ?? scan.photoUri ?? null;
}

/** "Today, 6:00 pm", "Tomorrow, 10:30 am", "Mon 23 Nov, 4:30 pm" */
export function slotLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  const t = `${d.getHours() % 12 === 0 ? 12 : d.getHours() % 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
  if (days === 0) return `Today, ${t}`;
  if (days === 1) return `Tomorrow, ${t}`;
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${dayMonth(iso)}, ${t}`;
}


/** This week, Monday first: which days had the full morning routine done (the streak strip on D2). */
export function weekStrip(s: AppState, now = new Date()): { key: string; letter: string; done: boolean; today: boolean; future: boolean }[] {
  const am = buildRoutine('am', s.profile, s.routinePrefs, s.scans[0]).map((x) => x.id);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const today = todayKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = todayKey(d);
    const log = s.routineLog[key] ?? [];
    return { key, letter: 'MTWTFSS'[i], done: am.length > 0 && am.every((id) => log.includes(id)), today: key === today, future: key > today };
  });
}

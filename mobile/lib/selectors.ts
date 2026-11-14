import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { CONCERNS, ROUTINE_LIBRARY, ZONE_LABEL } from '@/data/seed';
import type { ConcernKey, ConcernLevel, Scan, ZoneKey } from '@/data/types';
import { dayMonth, todayKey } from '@/lib/format';
import { buildRoutine } from '@/lib/routine';
import type { AppState } from '@/store/state';

export { todayKey };

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
  const steps = buildRoutine(period, s.profile, s.routinePrefs);
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
    if (!run) {
      setV(target);
      return;
    }
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
  return v;
}

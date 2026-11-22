import { ROUTINE_LIBRARY } from '@/data/seed';
import type { Period, RoutineStep, Scan } from '@/data/types';
import type { DoctorStep, Profile, RoutinePrefs } from '@/store/state';
import { todayKey } from '@/lib/format';

const MAX_COST: Record<RoutinePrefs['budget'], number> = { Low: 1, Medium: 2, Any: 3 };
const RANK = { Clear: 0, Mild: 1, Moderate: 2, High: 3 } as const;

export function doctorStep(d: DoctorStep): RoutineStep {
  return {
    id: d.id,
    period: d.period,
    title: d.title,
    subtitle: d.detail || 'From your dermatologist',
    ingredients: [d.title],
    why: `Added by ${d.by ?? 'your dermatologist'}.`,
    how: d.detail ? [d.detail] : [],
    avoid: '',
    rank: 0,
    cost: 1,
    targets: [],
    doctor: true,
    by: d.by,
  };
}

/** Steps a doctor paused that are still paused today. */
export function pausedIds(prefs: RoutinePrefs, today = todayKey()): Set<string> {
  return new Set(Object.entries(prefs.paused ?? {}).filter(([, until]) => until.slice(0, 10) > today).map(([id]) => id));
}

/**
 * The routine generator (PRD FR-6); backend/app/routine.py mirrors it so streaks and doctor changes agree.
 * - A routine of N steps takes each half of the day's N highest-ranked steps.
 * - Leaves out the always-avoid list, removed and paused steps, and steps over budget.
 * - With "Rebuild after each scan" on, treatments whose concerns read clear are dropped and the ones
 *   aimed at the worst concerns come first.
 * - Steps a dermatologist added always appear, before moisturiser and sunscreen.
 */
export function buildRoutine(period: Period, profile: Profile, prefs: RoutinePrefs, scan?: Scan): RoutineStep[] {
  const avoid = profile.avoid.map((a) => a.toLowerCase());
  const maxCost = MAX_COST[prefs.budget] ?? 3;
  const off = new Set([...prefs.removed, ...pausedIds(prefs)]);
  const need = (s: RoutineStep) => (scan && s.targets.length ? Math.max(...s.targets.map((k) => RANK[scan.concerns[k].level])) : -1);
  let steps = ROUTINE_LIBRARY.filter((s) => s.period === period)
    .filter((s) => s.rank <= prefs.length)
    .filter((s) => !off.has(s.id))
    .filter((s) => s.cost <= maxCost)
    // "No fragrance" is a property of the product, not an ingredient, so it never triggers the avoid list.
    .filter((s) => !s.ingredients.some((i) => !/^no\s/i.test(i) && avoid.some((a) => i.toLowerCase().includes(a))));
  if (prefs.rebuild && scan) {
    steps = steps.filter((s) => need(s) !== 0);
    const basics = steps.filter((s) => !s.targets.length);
    const treatments = steps.filter((s) => s.targets.length).sort((a, b) => need(b) - need(a));
    const keep = new Set([...basics, ...treatments].slice(0, prefs.length).map((s) => s.id));
    steps = steps.filter((s) => keep.has(s.id));
  } else {
    steps = steps.slice(0, prefs.length);
  }
  const extra = (prefs.doctorSteps ?? []).filter((d) => d.period === period && !off.has(d.id)).map(doctorStep);
  const tail = steps.filter((s) => /(moisturiser|spf)$/.test(s.id));
  const head = steps.filter((s) => !tail.includes(s));
  return [...head, ...extra, ...tail];
}

export function findStep(id: string, prefs?: RoutinePrefs): RoutineStep | undefined {
  const lib = ROUTINE_LIBRARY.find((s) => s.id === id);
  if (lib) return lib;
  const d = prefs?.doctorSteps?.find((x) => x.id === id);
  return d ? doctorStep(d) : undefined;
}

export function stepNumber(step: RoutineStep, profile: Profile, prefs: RoutinePrefs, scan?: Scan): number {
  return buildRoutine(step.period, profile, prefs, scan).findIndex((s) => s.id === step.id) + 1;
}

/** Morning until 4 pm, evening after (the routine screen opens on the right one). */
export function periodNow(d = new Date()): Period {
  const h = d.getHours();
  return h >= 4 && h < 16 ? 'am' : 'pm';
}

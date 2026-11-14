import { ROUTINE_LIBRARY } from '@/data/seed';
import type { Period, RoutineStep } from '@/data/types';
import type { Profile, RoutinePrefs } from '@/store/state';

/**
 * Stand-in for the routine generator (PRD FR-6). Picks steps by routine length and
 * leaves out anything matching the patient's always-avoid list or removed by a doctor.
 */
export function buildRoutine(period: Period, profile: Profile, prefs: RoutinePrefs): RoutineStep[] {
  const avoid = profile.avoid.map((a) => a.toLowerCase());
  return ROUTINE_LIBRARY.filter((s) => s.period === period)
    .filter((s) => s.minLength <= prefs.length)
    .filter((s) => !prefs.removed.includes(s.id))
    // "No fragrance" is a property of the product, not an ingredient, so it never triggers the avoid list.
    .filter((s) => !s.ingredients.some((i) => !/^no\s/i.test(i) && avoid.some((a) => i.toLowerCase().includes(a))))
    .slice(0, prefs.length === 3 ? 3 : prefs.length === 4 ? 4 : 6);
}

export function findStep(id: string): RoutineStep | undefined {
  return ROUTINE_LIBRARY.find((s) => s.id === id);
}

export function stepNumber(step: RoutineStep, profile: Profile, prefs: RoutinePrefs): number {
  return buildRoutine(step.period, profile, prefs).findIndex((s) => s.id === step.id) + 1;
}

/**
 * Display helpers for scan results. The analysis itself runs on the server
 * (backend/app/analysis/), which checks photo quality and scores each concern per face zone.
 */
import { CONCERN_ORDER } from '@/data/seed';
import type { ConcernKey, ConcernLevel, Scan } from '@/data/types';

export const ANALYSIS_STAGES = [
  'Checking the photo',
  'Finding your face',
  'Reading your forehead',
  'Reading your cheeks and nose',
  'Reading your chin and building your results',
] as const;

/** Same bands as the server (backend/app/analysis/base.py level_for). */
export function levelFor(pct: number): ConcernLevel {
  if (pct < 30) return 'Clear';
  if (pct < 60) return 'Mild';
  if (pct < 76) return 'Moderate';
  return 'High';
}

/** Concerns ordered by how visible they are, most first. */
export function rankedConcerns(scan: Scan): ConcernKey[] {
  return [...CONCERN_ORDER].sort((a, b) => scan.concerns[b].pct - scan.concerns[a].pct);
}

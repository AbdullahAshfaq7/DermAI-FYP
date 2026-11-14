/**
 * Stand-in for the skin-analysis service (PRD FR-3 to FR-5).
 * There is no model yet, so this produces a plausible reading from the previous scan and the profile.
 * Replace `analysePhoto` with a POST /scans call once the back end exists; the Scan shape is the contract.
 */
import { CONCERN_ORDER } from '@/data/seed';
import type { ConcernKey, ConcernLevel, Scan, ZoneKey } from '@/data/types';
import type { Profile } from '@/store/state';

export const ANALYSIS_STAGES = [
  'Checking the photo',
  'Finding your face',
  'Reading your forehead',
  'Reading your cheeks and nose',
  'Reading your chin and building your results',
] as const;

export interface QualityCheck {
  key: 'face' | 'focus' | 'light';
  label: string;
  ok: boolean;
  note?: string;
}

export function levelFor(pct: number): ConcernLevel {
  if (pct < 30) return 'Clear';
  if (pct < 60) return 'Mild';
  if (pct < 76) return 'Moderate';
  return 'High';
}

/** Simulated review checks. A real build runs face, blur and exposure detection on device. */
export function reviewChecks(seed: number): QualityCheck[] {
  const dim = seed % 3 === 0;
  return [
    { key: 'face', label: 'Face fully visible', ok: true },
    { key: 'focus', label: 'In focus', ok: true },
    dim
      ? { key: 'light', label: 'Slightly dim on the left side', ok: false, note: 'Still usable' }
      : { key: 'light', label: 'Even light', ok: true },
  ];
}

const ZONES_FOR: Record<ConcernKey, ZoneKey[]> = {
  acne: ['chin', 'forehead'],
  dryness: ['rightCheek', 'leftCheek'],
  redness: ['nose', 'leftCheek'],
  darkSpots: ['rightCheek'],
  sensitivity: ['leftCheek'],
  pores: ['nose'],
};

const RANK: Record<ConcernLevel, number> = { Clear: 0, Mild: 1, Moderate: 2, High: 3 };

export function analysePhoto(previous: Scan | undefined, profile: Profile, photoUri: string, dim: boolean): Scan {
  const concerns = {} as Scan['concerns'];
  for (const key of CONCERN_ORDER) {
    const base = previous?.concerns[key].pct ?? (profile.concerns.includes(key) ? 62 : 35);
    const drift = previous ? -Math.round(2 + Math.random() * 4) : Math.round(Math.random() * 8 - 4);
    const pct = Math.max(5, Math.min(95, base + drift));
    concerns[key] = { pct, level: levelFor(pct) };
  }
  const zones: Scan['zones'] = { forehead: 'Clear', nose: 'Clear', leftCheek: 'Clear', rightCheek: 'Clear', chin: 'Clear' };
  for (const key of CONCERN_ORDER) {
    for (const z of ZONES_FOR[key]) {
      if (RANK[concerns[key].level] > RANK[zones[z]]) zones[z] = concerns[key].level;
    }
  }
  const avg = CONCERN_ORDER.reduce((s, k) => s + concerns[k].pct, 0) / CONCERN_ORDER.length;
  const score = Math.max(20, Math.min(98, Math.round(100 - avg * 0.55)));
  return {
    id: `scan-${Date.now()}`,
    date: new Date().toISOString(),
    score: previous ? Math.max(score, previous.score + 1) : score,
    concerns,
    zones,
    where: ZONES_FOR,
    quality: dim ? 'dim' : 'good',
    photoUri,
    photoTone: profile.tone ?? 2,
    sharedWith: [],
  };
}

/** Concerns ordered by how visible they are, most first. */
export function rankedConcerns(scan: Scan): ConcernKey[] {
  return [...CONCERN_ORDER].sort((a, b) => scan.concerns[b].pct - scan.concerns[a].pct);
}

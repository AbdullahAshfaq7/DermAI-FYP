import { addDays } from '@/lib/format';

/** Bookable slots come from the server (GET /doctors/{id}/slots), built from the doctor's real hours. */
export function nextDays(n = 7, from = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

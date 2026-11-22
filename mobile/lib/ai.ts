/**
 * Ask DermAI runs on the server (POST /ai/chat): replies are grounded in the latest scan and
 * profile and refer red-flag symptoms to a dermatologist with a real open slot.
 * The LLM upgrade is listed in docs/NEXT.md.
 */
import { CONCERNS } from '@/data/seed';
import type { Scan } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';

const ZONE = { forehead: 'forehead', nose: 'nose', leftCheek: 'cheeks', rightCheek: 'cheeks', chin: 'chin' } as const;

/** Starter questions about the latest scan. */
export function aiSuggestions(scan?: Scan): string[] {
  if (!scan) return ['What should my first routine be?', 'Is retinol safe for me?', 'How do I read my scan?'];
  const out: string[] = [];
  const [top, second] = rankedConcerns(scan);
  const where = scan.where[top]?.[0];
  if (top === 'acne') out.push(`Why is my ${where ? ZONE[where] : 'skin'} breaking out?`);
  else if (top === 'redness') out.push(`Why is my ${where ? ZONE[where] : 'face'} red after washing?`);
  else out.push(`What helps ${CONCERNS[top].label.toLowerCase()}?`);
  out.push('Explain my scan');
  out.push(second === 'darkSpots' || top === 'darkSpots' ? 'Can I use vitamin C with my acid?' : 'Is retinol safe for me?');
  return out;
}

export const AI_SUGGESTIONS = aiSuggestions();

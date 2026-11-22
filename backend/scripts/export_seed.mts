// Copies the app's static content (concerns, routine library, tones...) into backend/app/seed_data.json
// so the server builds routines and AI replies from the same text. Demo people and records in that file
// are owned by the backend and are left untouched.
// Run: node backend/scripts/export_seed.mts  (Node 22.18+ strips TypeScript types)
import { readFileSync, writeFileSync } from 'node:fs';
import * as seed from '../../mobile/data/seed.ts';

const file = new URL('../app/seed_data.json', import.meta.url);
const current = JSON.parse(readFileSync(file, 'utf8'));
const content = {
  CONCERN_ORDER: seed.CONCERN_ORDER,
  ZONE_LABEL: seed.ZONE_LABEL,
  SKIN_TONES: seed.SKIN_TONES,
  CONCERNS: seed.CONCERNS,
  ROUTINE_LIBRARY: seed.ROUTINE_LIBRARY,
  DEFAULT_AVAILABILITY: seed.DEFAULT_AVAILABILITY,
};
writeFileSync(file, JSON.stringify({ ...current, ...content }, null, 2) + '\n');
console.log('updated content in backend/app/seed_data.json');

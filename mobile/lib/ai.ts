/**
 * Placeholder for the grounded LLM assistant (PRD FR-7). Replies use the latest scan and profile,
 * follow the voice rules in design.md section 9, and always refer red-flag symptoms to a dermatologist.
 * Swap `reply` for a streaming API call when the back end exists.
 */
import { CONCERNS, SKIN_TONES, ZONE_LABEL } from '@/data/seed';
import type { Scan } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth } from '@/lib/format';
import type { Profile } from '@/store/state';

const RED_FLAGS = /(won['’]?t go away|for weeks|weeks|months|painful|hurts?|bleed|bleeding|chang(e|ed|ing) (shape|colou?r|size)|mole|spreading|swell|pus|fever|cyst)/i;

export interface AiReply {
  text: string;
  referral: boolean;
}

export const AI_SUGGESTIONS = ['Why is my nose red after washing?', 'Explain my scan', 'Is retinol safe for me?'];

export function reply(prompt: string, scan: Scan | undefined, profile: Profile): AiReply {
  const p = prompt.toLowerCase();
  const tone = profile.tone != null ? SKIN_TONES[profile.tone].toLowerCase() : 'your';
  const flagged = RED_FLAGS.test(prompt);

  if (/pop|squeez|pick/.test(p)) {
    return {
      text: `Please don't. Deep, painful bumps are often cystic acne, and squeezing can scar, especially on ${tone} skin where marks linger. A warm compress twice a day can ease the pain.${flagged ? ' Because they\'ve lasted and hurt, this is worth a dermatologist\'s look.' : ''}`,
      referral: true,
    };
  }
  if (/explain|my scan|result|score/.test(p)) {
    if (!scan) return { text: 'You don\'t have a scan yet. Your first one takes about a minute, and then I can explain each concern.', referral: false };
    const top = rankedConcerns(scan).slice(0, 2);
    const parts = top.map((k) => {
      const where = (scan.where[k] ?? []).map((z) => ZONE_LABEL[z]).join(' and ');
      return `${CONCERNS[k].label.toLowerCase()} is ${scan.concerns[k].level.toLowerCase()}${where ? ` on your ${where}` : ''}`;
    });
    return {
      text: `Your ${dayMonth(scan.date)} scan scored ${scan.score}. The two things to focus on: ${parts.join(', and ')}. Your routine already targets both; give it 4 to 6 weeks before judging.`,
      referral: false,
    };
  }
  if (/retinol/.test(p)) {
    const avoids = profile.avoid.some((a) => /retinol/i.test(a));
    return {
      text: avoids
        ? 'You told us retinol bothers your skin, so I\'ve kept it out of your routine. Azelaic acid is a gentler option for marks and redness.'
        : 'Retinol can help with marks and texture, but your scan shows moderate redness and some sensitivity. Start with azelaic acid first; if your skin stays calm for a month, a low-strength retinol twice a week is reasonable.',
      referral: false,
    };
  }
  if (/red|flush/.test(p)) {
    return {
      text: `Redness straight after washing usually means the water is too hot or the cleanser too strong. Try lukewarm water and pat dry. On ${tone} skin redness can look darker rather than pink.${flagged ? ' If it lasts for weeks, a dermatologist can check for rosacea.' : ''}`,
      referral: flagged,
    };
  }
  if (/dry|tight|flak/.test(p)) {
    return { text: 'Apply moisturiser within a minute of washing, while your skin is still damp, and use a ceramide cream at night. Cheeks usually need more than the T-zone.', referral: flagged };
  }
  if (/spot|mark|pigment|dark/.test(p)) {
    return { text: 'Dark marks fade slowly on deeper skin. Daily mineral SPF stops them darkening; azelaic acid at night fades them over 8 to 12 weeks.', referral: flagged };
  }
  if (flagged) {
    return {
      text: 'I can share general guidance, but something that hurts, bleeds, spreads or changes shape should be looked at by a dermatologist. You can send your latest scan to one from here.',
      referral: true,
    };
  }
  return {
    text: 'Good question. In general: a gentle cleanser, a moisturiser that suits your type, and SPF every morning come first. Tell me what you\'re noticing and where on your face, and I\'ll tailor it to your scan.',
    referral: false,
  };
}

/**
 * Static content the app ships with: concern copy, the routine library, tones and pickers.
 * People, scans, bookings and messages come from the API (backend/); the demo accounts are seeded there.
 * backend/scripts/export_seed.mts copies this content to the backend so both sides agree.
 */
import type { Availability, ConcernInfo, ConcernKey, RoutineStep, ServiceType, ZoneKey } from '@/data/types';

export const CONCERN_ORDER: ConcernKey[] = ['acne', 'dryness', 'redness', 'darkSpots', 'sensitivity', 'pores'];

export const ZONE_LABEL: Record<ZoneKey, string> = {
  forehead: 'forehead',
  nose: 'nose',
  leftCheek: 'left cheek',
  rightCheek: 'right cheek',
  chin: 'chin',
};

export const SKIN_TONES = ['Very fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Deep'] as const;
export const FITZ_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

export const CONCERNS: Record<ConcernKey, ConcernInfo> = {
  acne: {
    key: 'acne',
    label: 'Acne',
    icon: 'water-drop',
    toneNote: 'On medium to deep skin, spots often leave dark marks that last longer than the spot itself.',
    helps: [
      { icon: 'science', title: 'Salicylic acid 2%', subtitle: 'Clears pores, evening, 3 times a week' },
      { icon: 'spa', title: 'Niacinamide 5%', subtitle: 'Calms spots and fades marks' },
    ],
    doctorHint: 'Deep, painful or scarring spots? A dermatologist can offer treatments you can\'t buy over the counter.',
  },
  dryness: {
    key: 'dryness',
    label: 'Dryness',
    icon: 'eco',
    toneNote: 'Dry patches can look ashy or grey on deeper skin rather than red.',
    helps: [
      { icon: 'water-drop', title: 'Glycerin or hyaluronic acid', subtitle: 'On damp skin, morning and night' },
      { icon: 'spa', title: 'Ceramide moisturiser', subtitle: 'Seals water in, especially on cheeks' },
    ],
    doctorHint: 'Cracking, bleeding or itchy patches that don\'t settle may need a dermatologist\'s look.',
  },
  redness: {
    key: 'redness',
    label: 'Redness',
    icon: 'local-fire-department',
    toneNote: 'On medium skin it can show as darker, not pinker, patches.',
    helps: [
      { icon: 'spa', title: 'Azelaic acid or niacinamide', subtitle: 'Calms redness, evening' },
      { icon: 'wb-sunny', title: 'SPF 30+ every morning', subtitle: 'Heat and sun make it worse' },
    ],
    doctorHint: 'Not easing in 6 weeks? A dermatologist can check for rosacea.',
  },
  darkSpots: {
    key: 'darkSpots',
    label: 'Dark spots',
    icon: 'blur-on',
    toneNote: 'Deeper skin makes more pigment after any irritation, so marks are common and slow to fade.',
    helps: [
      { icon: 'wb-sunny', title: 'Mineral SPF 30+ daily', subtitle: 'Stops marks getting darker' },
      { icon: 'science', title: 'Azelaic acid 10%', subtitle: 'Fades marks over 8 to 12 weeks' },
    ],
    doctorHint: 'A spot that changes shape, colour or size should be seen by a dermatologist soon.',
  },
  sensitivity: {
    key: 'sensitivity',
    label: 'Sensitivity',
    icon: 'favorite-border',
    toneNote: 'Stinging and tightness matter more than colour change on deeper skin.',
    helps: [
      { icon: 'block', title: 'Fragrance-free products', subtitle: 'Fewer ingredients, fewer reactions' },
      { icon: 'spa', title: 'Patch test new products', subtitle: 'Inside the arm for 48 hours' },
    ],
    doctorHint: 'Swelling, hives or burning after a product? Stop it and see a dermatologist.',
  },
  pores: {
    key: 'pores',
    label: 'Pores',
    icon: 'grid-view',
    toneNote: 'Pores look the same on every tone; oil and heat make them more visible.',
    helps: [
      { icon: 'spa', title: 'Niacinamide 5%', subtitle: 'Balances oil on the T-zone' },
      { icon: 'science', title: 'Salicylic acid 2%', subtitle: 'Clears the pore lining, evening' },
    ],
    doctorHint: 'Pores are harmless. A dermatologist can discuss procedures if they bother you.',
  },
};

export const ROUTINE_LIBRARY: RoutineStep[] = [
  {
    id: 'am-cleanser',
    period: 'am',
    title: 'Gentle cleanser',
    subtitle: 'Fragrance-free, lukewarm water',
    ingredients: ['Glycerin', 'No sulfates', 'No fragrance'],
    why: 'Hot water and foaming cleansers strip oil and make redness worse. A gentle wash keeps your barrier calm.',
    how: ['Wet your face with lukewarm water', 'Massage a pea-sized amount for 30 seconds', 'Pat dry, don\'t rub'],
    avoid: 'Skip scrubs and anything that leaves your skin feeling tight.',
    rank: 1,
    lookFor: ['glycerin', 'sulfate-free'],
    cost: 1,
    targets: [],
  },
  {
    id: 'am-niacinamide',
    period: 'am',
    title: 'Niacinamide 5% serum',
    subtitle: 'For redness and pores',
    ingredients: ['Niacinamide 5%', 'Zinc PCA'],
    why: 'Niacinamide calms visible redness and balances oil on your nose, where pores show most.',
    how: ['Two to three drops on dry skin', 'Press in over cheeks and nose', 'Wait a minute before moisturiser'],
    avoid: 'Start at 5%. Higher strengths can sting on sensitive skin.',
    rank: 4,
    lookFor: ['niacinamide', 'vitamin B3', 'nicotinamide'],
    cost: 2,
    targets: ['redness', 'pores'],
  },
  {
    id: 'am-moisturiser',
    period: 'am',
    title: 'Light gel moisturiser',
    subtitle: 'Cheeks first, they\'re drier',
    ingredients: ['Ceramides', 'Hyaluronic acid', 'No fragrance'],
    why: 'Your cheeks read drier than your T-zone. A light gel hydrates without clogging the nose area.',
    how: ['A fingertip amount', 'Cheeks first, then forehead and nose', 'Let it sink in for a minute'],
    avoid: 'Heavy creams on the T-zone can add shine and congestion.',
    rank: 3,
    lookFor: ['ceramides', 'hyaluronic acid'],
    cost: 1,
    targets: [],
  },
  {
    id: 'am-spf',
    period: 'am',
    title: 'Mineral SPF 30+',
    subtitle: 'Reapply at 1 pm if outdoors',
    ingredients: ['Zinc oxide', 'Titanium dioxide', 'No fragrance'],
    why: 'Sun makes redness and dark spots worse. Mineral filters suit sensitive skin better than chemical ones.',
    how: ['Two finger-lengths for face and neck', 'Last step, after moisturiser', 'Reapply every 2 hours outside'],
    avoid: 'Skip products with alcohol high on the list; they sting on your skin.',
    rank: 2,
    lookFor: ['zinc oxide', 'titanium dioxide', 'SPF 30', 'SPF 50'],
    cost: 1,
    targets: [],
  },
  {
    id: 'am-vitc',
    period: 'am',
    title: 'Vitamin C serum',
    subtitle: 'Brightens dark marks',
    ingredients: ['Ascorbic acid 10%', 'Vitamin E', 'Ferulic acid'],
    why: 'Vitamin C helps fade marks left by old spots and boosts your sunscreen.',
    how: ['After cleansing, before niacinamide', 'Three drops over the face', 'Store away from light'],
    avoid: 'If it stings, use it every other day.',
    rank: 5,
    lookFor: ['ascorbic acid', 'L-ascorbic acid', 'vitamin C'],
    wait: 'Let it sink in for a minute before the next step.',
    cost: 3,
    targets: ['darkSpots'],
  },
  {
    id: 'pm-cleanser',
    period: 'pm',
    title: 'Gentle cleanser',
    subtitle: 'Twice if you wore sunscreen',
    ingredients: ['Glycerin', 'No sulfates', 'No fragrance'],
    why: 'Removing sunscreen and oil at night lets the evening treatment work.',
    how: ['Massage for 60 seconds', 'Rinse with lukewarm water', 'Pat dry'],
    avoid: 'Avoid makeup wipes; they leave residue and rub the skin.',
    rank: 1,
    lookFor: ['glycerin', 'sulfate-free'],
    cost: 1,
    targets: [],
  },
  {
    id: 'pm-azelaic',
    period: 'pm',
    title: 'Azelaic acid 10%',
    subtitle: 'For redness and dark spots',
    ingredients: ['Azelaic acid 10%'],
    why: 'Azelaic acid calms redness and fades dark spots, and is gentle enough for sensitive skin.',
    how: ['A pea-sized amount on dry skin', 'Start every other night', 'Go nightly after two weeks if it doesn\'t sting'],
    avoid: 'Don\'t layer it with other acids on the same night.',
    rank: 3,
    conflict: 'Not on the same night as other acids or retinol.',
    lookFor: ['azelaic acid'],
    wait: 'Let it dry for a few minutes before moisturiser.',
    cost: 2,
    targets: ['redness', 'darkSpots'],
  },
  {
    id: 'pm-moisturiser',
    period: 'pm',
    title: 'Barrier repair cream',
    subtitle: 'Seals in the treatment',
    ingredients: ['Ceramides', 'Cholesterol', 'Squalane'],
    why: 'A richer cream at night supports your skin barrier while you sleep.',
    how: ['A fingertip amount', 'Pat over the whole face', 'Extra on dry patches'],
    avoid: 'Skip fragranced night creams.',
    rank: 2,
    lookFor: ['ceramides', 'squalane'],
    cost: 1,
    targets: [],
  },
  {
    id: 'pm-salicylic',
    period: 'pm',
    title: 'Salicylic acid 2%',
    subtitle: 'Chin and nose only, 3 nights a week',
    ingredients: ['Salicylic acid 2%'],
    why: 'Clears congested pores where your spots appear without drying your cheeks.',
    how: ['On alternate nights to azelaic acid', 'Only on chin and nose', 'Follow with moisturiser'],
    avoid: 'Stop if your skin peels or stings for more than a minute.',
    rank: 4,
    conflict: 'Not on the same night as retinol or azelaic acid.',
    lookFor: ['salicylic acid', 'BHA', 'beta hydroxy acid'],
    wait: 'Wait 10 minutes after the acid before moisturiser.',
    cost: 2,
    targets: ['acne', 'pores'],
  },
  {
    id: 'pm-spot',
    period: 'pm',
    title: 'Hydrocolloid patch',
    subtitle: 'On any open spot',
    ingredients: ['Hydrocolloid'],
    why: 'Patches protect open spots so you don\'t pick them, which prevents dark marks.',
    how: ['Clean, dry skin', 'Press on for the night', 'Peel off in the morning'],
    avoid: 'Don\'t use on cysts under the skin; they need a dermatologist.',
    rank: 5,
    lookFor: ['hydrocolloid'],
    cost: 1,
    targets: ['acne'],
  },
];

/* ───────────── Dermatologist side ───────────── */

export const DEFAULT_AVAILABILITY: Availability = {
  days: [
    { day: 'Mon', open: true, from: '2:00 pm', to: '7:00 pm' },
    { day: 'Tue', open: true, from: '2:00 pm', to: '7:00 pm' },
    { day: 'Wed', open: true, from: '2:00 pm', to: '7:00 pm' },
    { day: 'Thu', open: true, from: '2:00 pm', to: '7:00 pm' },
    { day: 'Fri', open: true, from: '3:00 pm', to: '6:00 pm' },
    { day: 'Sat', open: true, from: '11:00 am', to: '2:00 pm' },
    { day: 'Sun', open: false, from: '', to: '' },
  ],
  gapMinutes: 10,
  noticeHours: 3,
  timeOff: null,
};

export const FINDING_SUGGESTIONS = ['Nodulocystic acne', 'Hormonal pattern', 'Inflammatory acne', 'Post-inflammatory hyperpigmentation', 'Rosacea', 'Melasma', 'Contact dermatitis', 'Refer for biopsy'];

export const ALLERGEN_SUGGESTIONS = ['Fragrance', 'Benzoyl peroxide', 'Retinol', 'Salicylic acid', 'Alcohol', 'Essential oils', 'Lanolin', 'Vitamin C', 'Glycolic acid', 'Coconut oil'];

/** Seeded demo accounts (backend/app/seed.py). Shown on the log-in screen in development builds only. */
export const DEMO_ACCOUNTS = { patient: 'ayesha@mail.com', doctor: 'sana@clinic.pk', password: 'demo1234' } as const;

export const SERVICE_META: Record<ServiceType, { title: string; short: string; icon: 'videocam' | 'location-on' | 'chat' }> = {
  video: { title: 'Video visit', short: 'Video', icon: 'videocam' },
  clinic: { title: 'Clinic visit', short: 'Clinic', icon: 'location-on' },
  message: { title: 'Case review by message', short: 'Message', icon: 'chat' },
};

/**
 * Demo content. Nothing here comes from a server yet; it stands in for the API until the back end exists.
 * Names, dates and numbers follow Claude outputs/storyboard.html.
 */
import type {
  AppNotification,
  Appointment,
  Availability,
  Case,
  ConcernInfo,
  ConcernKey,
  Doctor,
  RoutineStep,
  SavedItem,
  Scan,
  ServiceType,
  Thread,
  Visit,
  ZoneKey,
} from '@/data/types';

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

const zonesA = { forehead: 'Mild', nose: 'Moderate', leftCheek: 'Moderate', rightCheek: 'Mild', chin: 'Clear' } as const;

export const DEMO_SCANS: Scan[] = [
  {
    id: 'scan-1112',
    date: '2026-11-12T09:12:00+05:00',
    score: 72,
    concerns: {
      acne: { pct: 48, level: 'Mild' },
      dryness: { pct: 22, level: 'Clear' },
      redness: { pct: 68, level: 'Moderate' },
      darkSpots: { pct: 40, level: 'Mild' },
      sensitivity: { pct: 55, level: 'Mild' },
      pores: { pct: 61, level: 'Moderate' },
    },
    zones: zonesA,
    where: { redness: ['nose', 'leftCheek'], acne: ['chin', 'forehead'], darkSpots: ['rightCheek'], pores: ['nose'], sensitivity: ['leftCheek'], dryness: ['rightCheek'] },
    quality: 'good',
    photoTone: 3,
    sharedWith: [],
  },
  {
    id: 'scan-1102',
    date: '2026-11-02T08:50:00+05:00',
    score: 69,
    concerns: {
      acne: { pct: 52, level: 'Mild' },
      dryness: { pct: 25, level: 'Clear' },
      redness: { pct: 71, level: 'Moderate' },
      darkSpots: { pct: 42, level: 'Mild' },
      sensitivity: { pct: 57, level: 'Mild' },
      pores: { pct: 62, level: 'Moderate' },
    },
    zones: zonesA,
    where: { redness: ['nose', 'leftCheek'], acne: ['chin'] },
    quality: 'good',
    photoTone: 3,
    sharedWith: ['dr-sana'],
  },
  {
    id: 'scan-1029',
    date: '2026-10-29T09:05:00+05:00',
    score: 66,
    concerns: {
      acne: { pct: 45, level: 'Mild' },
      dryness: { pct: 20, level: 'Clear' },
      redness: { pct: 74, level: 'Moderate' },
      darkSpots: { pct: 45, level: 'Mild' },
      sensitivity: { pct: 60, level: 'Moderate' },
      pores: { pct: 63, level: 'Moderate' },
    },
    zones: { ...zonesA, rightCheek: 'Moderate' },
    where: { redness: ['nose', 'leftCheek', 'rightCheek'] },
    quality: 'good',
    photoTone: 3,
    sharedWith: ['dr-sana'],
  },
  {
    id: 'scan-1018',
    date: '2026-10-18T19:40:00+05:00',
    score: 62,
    concerns: {
      acne: { pct: 55, level: 'Mild' },
      dryness: { pct: 30, level: 'Mild' },
      redness: { pct: 77, level: 'High' },
      darkSpots: { pct: 47, level: 'Mild' },
      sensitivity: { pct: 62, level: 'Moderate' },
      pores: { pct: 64, level: 'Moderate' },
    },
    zones: { ...zonesA, leftCheek: 'High' },
    where: { redness: ['nose', 'leftCheek'] },
    quality: 'dim',
    photoTone: 3,
    sharedWith: ['dr-sana'],
  },
  {
    id: 'scan-1008',
    date: '2026-10-08T09:30:00+05:00',
    score: 58,
    concerns: {
      acne: { pct: 60, level: 'Moderate' },
      dryness: { pct: 34, level: 'Mild' },
      redness: { pct: 80, level: 'High' },
      darkSpots: { pct: 50, level: 'Mild' },
      sensitivity: { pct: 66, level: 'Moderate' },
      pores: { pct: 66, level: 'Moderate' },
    },
    zones: { forehead: 'Mild', nose: 'High', leftCheek: 'High', rightCheek: 'Moderate', chin: 'Mild' },
    where: { redness: ['nose', 'leftCheek'] },
    quality: 'good',
    photoTone: 3,
    sharedWith: [],
  },
];

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
    minLength: 3,
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
    minLength: 4,
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
    minLength: 3,
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
    minLength: 3,
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
    minLength: 6,
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
    minLength: 3,
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
    minLength: 4,
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
    minLength: 3,
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
    minLength: 6,
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
    minLength: 6,
  },
];

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-sana',
    name: 'Dr. Sana Iqbal',
    pmdc: '54123-P',
    qualifications: 'MBBS, FCPS Dermatology',
    years: 11,
    rating: 4.9,
    reviews: 212,
    replyHours: 2,
    bio: 'Treats acne, melasma and post-acne marks, with a focus on South Asian skin.',
    focus: 'Acne, pigmentation',
    specialties: ['Acne', 'Pigmentation', 'Melasma'],
    city: 'Lahore',
    clinic: 'Gulberg III, Lahore',
    female: true,
    tone: 3,
    services: [
      { type: 'video', fee: 3000, detail: '20 min' },
      { type: 'clinic', fee: 3500, detail: 'Gulberg III, Lahore' },
      { type: 'message', fee: 1500, detail: 'She reviews your scan in 24 hrs' },
    ],
    nextFree: 'Free today',
  },
  {
    id: 'dr-umar',
    name: 'Dr. Umar Aziz',
    pmdc: '61877-P',
    qualifications: 'MBBS, MCPS Dermatology',
    years: 7,
    rating: 4.7,
    reviews: 98,
    replyHours: 4,
    bio: 'Rosacea, eczema and sensitive skin. Prefers seeing new patients in person first.',
    focus: 'Rosacea, eczema',
    specialties: ['Redness', 'Eczema', 'Sensitivity'],
    city: 'Lahore',
    clinic: 'DHA Phase 5, Lahore',
    female: false,
    tone: 4,
    services: [
      { type: 'clinic', fee: 2500, detail: 'DHA Phase 5, Lahore' },
      { type: 'message', fee: 1200, detail: 'He reviews your scan in 24 hrs' },
    ],
    nextFree: 'Next: Mon',
  },
  {
    id: 'dr-hira',
    name: 'Dr. Hira Khan',
    pmdc: '70219-P',
    qualifications: 'MBBS, FCPS Dermatology',
    years: 9,
    rating: 4.8,
    reviews: 143,
    replyHours: 3,
    bio: 'Acne scars and post-inflammatory marks. Video consults across Pakistan.',
    focus: 'Acne scars',
    specialties: ['Acne', 'Scars', 'Pigmentation'],
    city: 'Karachi',
    clinic: 'Video only',
    female: true,
    tone: 2,
    services: [
      { type: 'video', fee: 2000, detail: '20 min' },
      { type: 'message', fee: 1000, detail: 'She reviews your scan in 24 hrs' },
    ],
    nextFree: 'Next: Tue',
  },
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    doctorId: 'dr-sana',
    patientName: 'Ayesha Malik',
    service: 'video',
    start: '2026-11-16T16:30:00+05:00',
    minutes: 20,
    reason: 'Painful chin bumps for 3 weeks',
    sharedScanIds: ['scan-1102', 'scan-1029', 'scan-1018'],
    status: 'upcoming',
    fee: 3000,
  },
  {
    id: 'appt-0',
    doctorId: 'dr-sana',
    patientName: 'Ayesha Malik',
    service: 'message',
    start: '2026-10-20T11:00:00+05:00',
    minutes: 0,
    reason: 'Redness after new cleanser',
    sharedScanIds: ['scan-1018'],
    status: 'done',
    fee: 1500,
  },
];

export const DEMO_THREADS: Thread[] = [
  {
    id: 'thread-ayesha',
    doctorId: 'dr-sana',
    patientName: 'Ayesha Malik',
    caseTitle: 'Chin bumps',
    sharedScans: 3,
    unreadForPatient: 1,
    unreadForDoctor: 1,
    messages: [
      { id: 'm1', from: 'patient', text: 'Hi doctor, the bumps on my chin hurt more in the evening.', at: '2026-11-13T09:12:00+05:00' },
      {
        id: 'm2',
        from: 'doctor',
        text: 'Thanks Ayesha. From your scans these look like inflamed cysts. Keep the routine as it is, stop the clay mask, and we\'ll go through options on Monday.',
        at: '2026-11-13T10:40:00+05:00',
        note: { stop: ['Clay mask'], keep: ['Niacinamide', 'SPF'] },
      },
    ],
  },
  {
    id: 'thread-omar',
    doctorId: 'dr-sana',
    patientName: 'Omar Farooq',
    caseTitle: 'Dark patches, forehead',
    sharedScans: 2,
    unreadForPatient: 0,
    unreadForDoctor: 1,
    messages: [{ id: 'o1', from: 'patient', text: 'Sent 1 photo', attachment: 'photo', at: '2026-11-15T08:40:00+05:00' }],
  },
  {
    id: 'thread-nida',
    doctorId: 'dr-sana',
    patientName: 'Nida Saleem',
    caseTitle: 'New patient',
    sharedScans: 1,
    unreadForPatient: 0,
    unreadForDoctor: 1,
    messages: [{ id: 'n1', from: 'patient', text: 'Can I move my visit to 5:30?', at: '2026-11-14T18:10:00+05:00' }],
  },
  {
    id: 'thread-hassan',
    doctorId: 'dr-sana',
    patientName: 'Hassan Ali',
    caseTitle: 'Follow-up',
    sharedScans: 4,
    unreadForPatient: 0,
    unreadForDoctor: 0,
    messages: [
      { id: 'h1', from: 'patient', text: 'Thank you, doctor.', at: '2026-11-09T12:00:00+05:00' },
      { id: 'h2', from: 'doctor', text: 'See you Monday.', at: '2026-11-09T12:30:00+05:00' },
    ],
  },
];

export const DEMO_SAVED: SavedItem[] = [
  { id: 'sv-1', kind: 'ingredient', title: 'Niacinamide 5%', subtitle: 'For redness and pores · evening', icon: 'spa', routineStepId: 'am-niacinamide', source: 'Results' },
  { id: 'sv-2', kind: 'ingredient', title: 'Azelaic acid 10%', subtitle: 'For redness and dark spots', icon: 'science', routineStepId: 'pm-azelaic', source: 'Results' },
  { id: 'sv-3', kind: 'ingredient', title: 'Mineral SPF 30+', subtitle: 'Zinc oxide, no fragrance', icon: 'wb-sunny', routineStepId: 'am-spf', source: 'Routine' },
  { id: 'sv-4', kind: 'doctor', title: 'Stop the clay mask', subtitle: 'Dr. Iqbal · 13 Nov', icon: 'stethoscope', source: 'Doctor chat' },
  { id: 'sv-5', kind: 'tip', title: 'Pat dry, don\'t rub', subtitle: 'Less friction, less redness', icon: 'lightbulb', source: 'AI chat' },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-reply', icon: 'chat', title: 'Dr. Iqbal replied', body: '"Thanks Ayesha. From your scans…"', at: '2026-11-15T10:40:00+05:00', href: '/thread/thread-ayesha', read: false },
  { id: 'n-routine', icon: 'wb-sunny', title: 'Morning routine', body: '2 steps left. SPF before you leave.', at: '2026-11-15T07:30:00+05:00', href: '/routine', read: false },
  { id: 'n-trend', icon: 'insights', title: 'Redness is easing', body: 'Down for 3 scans in a row', at: '2026-11-12T09:20:00+05:00', href: '/progress', read: false },
  { id: 'n-booked', icon: 'event-available', title: 'Visit booked', body: 'Mon 16 Nov, 4:30 pm', at: '2026-11-12T12:00:00+05:00', href: '/booked/appt-1', read: true },
  { id: 'n-rescan', icon: 'photo-camera', title: 'Time to rescan', body: '10 days since your last one', at: '2026-11-11T09:00:00+05:00', href: '/scan', read: true },
];

/* ───────────── Dermatologist side ───────────── */

const zonesFor = (nose: 'Clear' | 'Mild' | 'Moderate' | 'High', chin: 'Clear' | 'Mild' | 'Moderate' | 'High') =>
  ({ forehead: 'Mild', nose, leftCheek: 'Mild', rightCheek: 'Clear', chin }) as const;

export const DEMO_CASES: Case[] = [
  {
    id: 'case-bilal',
    patient: { name: 'Bilal Raza', age: 34, fitz: 4, type: 'Oily', avoids: [], tone: 4 },
    complaint: 'Mole changed shape in 2 months',
    summary: 'Changing mole, cheek · AI flagged',
    urgency: 'urgent',
    receivedAt: '2026-11-15T07:50:00+05:00',
    status: 'waiting',
    channel: 'message',
    photos: [
      { date: '2026-09-20', tone: 4 },
      { date: '2026-11-14', tone: 4 },
    ],
    ai: { confidence: 74, reading: 'Irregular pigmented lesion, right cheek, border change since last scan. Flagged for urgent review.', zones: { forehead: 'Clear', nose: 'Clear', leftCheek: 'Clear', rightCheek: 'High', chin: 'Clear' } },
  },
  {
    id: 'case-zara',
    patient: { name: 'Zara Tariq', age: 19, fitz: 3, type: 'Oily', avoids: ['Fragrance'], tone: 2 },
    complaint: 'Acne worsening over 4 scans',
    summary: 'Acne grade III, worsening',
    urgency: 'high',
    receivedAt: '2026-11-15T07:00:00+05:00',
    status: 'waiting',
    channel: 'message',
    photos: [
      { date: '2026-10-10', tone: 2 },
      { date: '2026-11-13', tone: 2 },
    ],
    ai: { confidence: 82, reading: 'Inflammatory acne, forehead and chin, grade III. Worse than 4 weeks ago.', zones: zonesFor('Moderate', 'High') },
  },
  {
    id: 'case-ayesha',
    patient: { name: 'Ayesha Malik', age: 26, fitz: 3, type: 'Combination', avoids: ['Fragrance', 'BPO'], tone: 3 },
    complaint: 'Painful chin bumps for 3 weeks',
    summary: 'Video · cystic acne, chin · 3 scans',
    urgency: 'moderate',
    receivedAt: '2026-11-15T04:00:00+05:00',
    status: 'waiting',
    channel: 'video',
    photos: [
      { date: '2026-10-22', tone: 3 },
      { date: '2026-11-12', tone: 3 },
    ],
    ai: { confidence: 87, reading: 'Inflammatory acne, chin and jaw. Redness moderate. Dark spots mild.', zones: { forehead: 'Mild', nose: 'Moderate', leftCheek: 'Moderate', rightCheek: 'Mild', chin: 'High' } },
    threadId: 'thread-ayesha',
  },
  {
    id: 'case-omar',
    patient: { name: 'Omar Farooq', age: 41, fitz: 5, type: 'Normal', avoids: [], tone: 4 },
    complaint: 'Dark patches, forehead',
    summary: 'Dark patches, forehead',
    urgency: 'mild',
    receivedAt: '2026-11-14T09:00:00+05:00',
    status: 'waiting',
    channel: 'message',
    photos: [
      { date: '2026-10-01', tone: 4 },
      { date: '2026-11-14', tone: 4 },
    ],
    ai: { confidence: 79, reading: 'Patchy hyperpigmentation, forehead, symmetrical. Pattern often seen with melasma.', zones: { forehead: 'Moderate', nose: 'Clear', leftCheek: 'Mild', rightCheek: 'Mild', chin: 'Clear' } },
    threadId: 'thread-omar',
  },
  {
    id: 'case-hassan',
    patient: { name: 'Hassan Ali', age: 29, fitz: 4, type: 'Oily', avoids: [], tone: 4 },
    complaint: 'Follow-up on acne treatment',
    summary: 'Follow-up · improving',
    urgency: 'mild',
    receivedAt: '2026-11-08T12:00:00+05:00',
    status: 'replied',
    channel: 'video',
    photos: [{ date: '2026-11-08', tone: 4 }],
    ai: { confidence: 85, reading: 'Mild acne, improving across 4 scans.', zones: zonesFor('Mild', 'Mild') },
    threadId: 'thread-hassan',
  },
  {
    id: 'case-farah',
    patient: { name: 'Farah Shah', age: 33, fitz: 3, type: 'Dry', avoids: ['Retinol'], tone: 2 },
    complaint: 'Dry patches around nose',
    summary: 'Closed · seborrhoeic pattern',
    urgency: 'mild',
    receivedAt: '2026-11-02T12:00:00+05:00',
    status: 'closed',
    channel: 'message',
    photos: [{ date: '2026-11-02', tone: 2 }],
    ai: { confidence: 69, reading: 'Flaky redness around the nose folds.', zones: zonesFor('Moderate', 'Clear') },
  },
];

export const DEMO_VISITS: Visit[] = [
  { id: 'v1', start: '2026-11-16T14:00:00+05:00', minutes: 30, kind: 'visit', patientName: 'Hassan A.', service: 'clinic', label: 'Clinic · follow-up', caseId: 'case-hassan' },
  { id: 'v2', start: '2026-11-16T16:30:00+05:00', minutes: 20, kind: 'visit', patientName: 'Ayesha M.', service: 'video', label: 'Video · 3 scans', caseId: 'case-ayesha' },
  { id: 'v3', start: '2026-11-16T17:00:00+05:00', minutes: 20, kind: 'visit', patientName: 'Nida S.', service: 'video', label: 'Video · new patient' },
  { id: 'v4', start: '2026-11-16T18:00:00+05:00', minutes: 60, kind: 'blocked', label: 'Blocked: clinic rounds' },
  { id: 'v5', start: '2026-11-15T15:00:00+05:00', minutes: 20, kind: 'visit', patientName: 'Zara T.', service: 'video', label: 'Video · acne review', caseId: 'case-zara' },
  { id: 'v6', start: '2026-11-17T15:30:00+05:00', minutes: 30, kind: 'visit', patientName: 'Omar F.', service: 'clinic', label: 'Clinic · new patient', caseId: 'case-omar' },
];

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
  timeOff: '20 to 24 Dec',
};

export const FINDING_SUGGESTIONS = ['Nodulocystic acne', 'Hormonal pattern', 'Inflammatory acne', 'Post-inflammatory hyperpigmentation', 'Rosacea', 'Melasma', 'Contact dermatitis', 'Refer for biopsy'];

export const ALLERGEN_SUGGESTIONS = ['Fragrance', 'Benzoyl peroxide', 'Retinol', 'Salicylic acid', 'Alcohol', 'Essential oils', 'Lanolin', 'Vitamin C', 'Glycolic acid', 'Coconut oil'];

export const DEMO_PATIENT = {
  name: 'Ayesha Malik',
  email: 'ayesha@mail.com',
  phone: '+92 300 1234567',
  dob: '14 Mar 2001',
  gender: 'Female',
  city: 'Lahore',
};

export const DEMO_DOCTOR_EMAIL = 'sana@clinic.pk';

export const SERVICE_META: Record<ServiceType, { title: string; short: string; icon: 'videocam' | 'location-on' | 'chat' }> = {
  video: { title: 'Video visit', short: 'Video', icon: 'videocam' },
  clinic: { title: 'Clinic visit', short: 'Clinic', icon: 'location-on' },
  message: { title: 'Case review by message', short: 'Message', icon: 'chat' },
};

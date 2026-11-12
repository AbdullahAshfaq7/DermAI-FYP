import { Ionicons } from '@expo/vector-icons';

export type RecommendationPriority = 'High' | 'Medium' | 'Low' | 'Conditional';

export type RecommendationStatus =
  | 'Not started'
  | 'In progress'
  | 'Completed today'
  | 'Active'
  | 'Due soon'
  | 'Conditional';

export type RecommendationTiming =
  | 'Morning'
  | 'Evening'
  | 'Morning & Evening'
  | 'Daily'
  | 'Weekly'
  | 'As needed';

export type RecommendationCategory =
  | 'Daily Essentials'
  | 'Targeted Care'
  | 'Lifestyle Guidance'
  | 'Follow-up';

export type FilterTag = 'Morning' | 'Evening' | 'Daily' | 'Weekly';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  timing: RecommendationTiming;
  frequency: string;
  duration: string;
  icon: IoniconName;
  accentColor: string;
  iconBackgroundColor: string;
  reason: string;
  steps: string[];
  ingredients?: string[];
  avoid?: string[];
  expectedResults: string;
  safetyNote?: string;
  filterTags: FilterTag[];
}

export const LATEST_SCAN_DATE = 'July 18, 2026';
export const OVERALL_SKIN_SCORE = 72;
export const MAIN_CONCERNS = ['Dryness', 'Redness', 'Sensitivity'] as const;

export const FILTER_OPTIONS: Array<'All' | FilterTag> = [
  'All',
  'Morning',
  'Evening',
  'Daily',
  'Weekly',
];

export const PREVIEW_RECOMMENDATION_IDS = [
  'hydration-boost',
  'sun-protection',
  'gentle-cleanser',
  'calming-serum',
  'next-steps',
] as const;

export const RECOMMENDATION_SECTIONS: RecommendationCategory[] = [
  'Daily Essentials',
  'Targeted Care',
  'Lifestyle Guidance',
  'Follow-up',
];

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'hydration-boost',
    title: 'Hydration Boost',
    summary: 'Use a hydrating serum daily to support moisture retention.',
    category: 'Daily Essentials',
    priority: 'High',
    status: 'Active',
    timing: 'Morning & Evening',
    frequency: 'Twice daily',
    duration: '2–4 weeks',
    icon: 'water',
    accentColor: '#06B6D4',
    iconBackgroundColor: '#ECFEFF',
    reason:
      'Your latest scan shows mild to moderate dryness. Adding a hydrating serum can help replenish moisture and support your skin barrier.',
    steps: [
      'Apply to clean, slightly damp skin after cleansing.',
      'Use 2–3 drops and press gently into the face and neck.',
      'Follow with moisturizer to seal in hydration.',
      'Use consistently for at least 2 weeks before evaluating results.',
    ],
    ingredients: ['Hyaluronic Acid', 'Glycerin', 'Ceramides'],
    avoid: ['Over-layering heavy oils immediately after', 'Applying to dry, un-cleansed skin'],
    expectedResults:
      'You may notice improved skin comfort and reduced tightness within 1–2 weeks with consistent use.',
    safetyNote:
      'Stop using the product if you experience persistent burning, swelling, or worsening irritation.',
    filterTags: ['Morning', 'Evening', 'Daily'],
  },
  {
    id: 'sun-protection',
    title: 'Sun Protection',
    summary: 'Apply SPF 30+ every morning, even on cloudy days.',
    category: 'Daily Essentials',
    priority: 'High',
    status: 'In progress',
    timing: 'Morning',
    frequency: 'Every morning',
    duration: 'Ongoing',
    icon: 'sunny',
    accentColor: '#F59E0B',
    iconBackgroundColor: '#FFFBEB',
    reason:
      'Sun exposure can worsen redness and dark spots. Daily SPF helps protect against UV-related irritation and uneven tone.',
    steps: [
      'Apply SPF as the final step of your morning routine.',
      'Use at least a nickel-sized amount for face and neck.',
      'Reapply every 2 hours if outdoors or after sweating.',
      'Choose broad-spectrum SPF 30 or higher.',
    ],
    ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Niacinamide'],
    avoid: ['Skipping SPF on overcast days', 'Mixing with incompatible active layers without patch testing'],
    expectedResults:
      'Consistent daily use helps reduce the risk of worsening redness and supports long-term skin clarity.',
    safetyNote:
      'Stop using the product if you experience persistent burning, swelling, or worsening irritation.',
    filterTags: ['Morning', 'Daily'],
  },
  {
    id: 'gentle-cleanser',
    title: 'Gentle Cleanser',
    summary: 'Use a mild, sulfate-free cleanser to avoid stripping the skin.',
    category: 'Daily Essentials',
    priority: 'Medium',
    status: 'Active',
    timing: 'Morning & Evening',
    frequency: 'Twice daily',
    duration: 'Ongoing',
    icon: 'sparkles',
    accentColor: '#8B5CF6',
    iconBackgroundColor: '#F5F3FF',
    reason:
      'Your scan suggests sensitivity and mild dryness. A gentle cleanser reduces the risk of barrier disruption from harsh surfactants.',
    steps: [
      'Use lukewarm water — avoid very hot water.',
      'Massage a small amount for 30–60 seconds.',
      'Rinse thoroughly and pat dry without rubbing.',
      'Follow immediately with toner or serum while skin is slightly damp.',
    ],
    avoid: ['Harsh scrubs', 'Sulfate-heavy formulas', 'Over-washing more than twice daily'],
    expectedResults:
      'Skin may feel less tight and reactive within the first week of switching to a gentler routine.',
    safetyNote:
      'Stop using the product if you experience persistent burning, swelling, or worsening irritation.',
    filterTags: ['Morning', 'Evening', 'Daily'],
  },
  {
    id: 'calming-serum',
    title: 'Calming Serum',
    summary: 'Niacinamide or Centella can help reduce visible redness.',
    category: 'Targeted Care',
    priority: 'High',
    status: 'Not started',
    timing: 'Evening',
    frequency: 'Once daily',
    duration: '3–4 weeks',
    icon: 'leaf',
    accentColor: '#14B8A6',
    iconBackgroundColor: '#F0FDFA',
    reason:
      'Moderate redness was detected in your latest scan. Calming ingredients may help soothe irritation and support an even-looking complexion.',
    steps: [
      'Apply after cleansing and before moisturizer.',
      'Start with a pea-sized amount every other evening.',
      'Increase to nightly use if well tolerated.',
      'Avoid combining with strong acids on the same night initially.',
    ],
    ingredients: ['Niacinamide', 'Centella Asiatica', 'Panthenol'],
    avoid: ['Layering multiple strong actives at once', 'Using on broken or severely irritated skin'],
    expectedResults:
      'Visible redness may appear softer over 2–4 weeks with consistent, gentle use.',
    safetyNote:
      'Stop using the product if you experience persistent burning, swelling, or worsening irritation.',
    filterTags: ['Evening', 'Daily'],
  },
  {
    id: 'barrier-repair-moisturizer',
    title: 'Barrier Repair Moisturizer',
    summary: 'Lock in moisture with a ceramide-rich cream.',
    category: 'Targeted Care',
    priority: 'Medium',
    status: 'Not started',
    timing: 'Morning & Evening',
    frequency: 'Twice daily',
    duration: '2–4 weeks',
    icon: 'shield-checkmark',
    accentColor: '#3B82F6',
    iconBackgroundColor: '#EFF6FF',
    reason:
      'Dryness and sensitivity often signal a weakened skin barrier. A ceramide-rich moisturizer helps restore and protect it.',
    steps: [
      'Apply as the last step in your routine (before SPF in the morning).',
      'Use a generous but comfortable amount on face and neck.',
      'Press in gently rather than rubbing vigorously.',
      'Reapply to dry areas as needed during the day.',
    ],
    ingredients: ['Ceramides', 'Squalane', 'Cholesterol'],
    avoid: ['Fragrance-heavy formulas if sensitive', 'Skipping moisturizer after active treatments'],
    expectedResults:
      'Improved skin comfort and reduced flaking may appear within 1–2 weeks.',
    safetyNote:
      'Stop using the product if you experience persistent burning, swelling, or worsening irritation.',
    filterTags: ['Morning', 'Evening', 'Daily'],
  },
  {
    id: 'avoid-harsh-exfoliation',
    title: 'Avoid Harsh Exfoliation',
    summary: 'Pause strong acids and scrubs until irritation subsides.',
    category: 'Targeted Care',
    priority: 'Conditional',
    status: 'Conditional',
    timing: 'As needed',
    frequency: 'Avoid until skin calms',
    duration: '1–2 weeks minimum',
    icon: 'ban',
    accentColor: '#8B5CF6',
    iconBackgroundColor: '#EDE9FE',
    reason:
      'Your scan shows signs of sensitivity and redness. Over-exfoliation may worsen irritation and delay recovery.',
    steps: [
      'Stop physical scrubs and high-strength chemical exfoliants temporarily.',
      'Focus on gentle cleansing and barrier support instead.',
      'Reintroduce exfoliation slowly, once weekly, if skin feels stable.',
      'Patch test any new active before full application.',
    ],
    avoid: ['Daily acid use', 'Combining retinol with strong AHAs/BHAs', 'Aggressive scrubbing'],
    expectedResults:
      'Reducing exfoliation may help calm visible redness within 1–2 weeks.',
    filterTags: ['Daily'],
  },
  {
    id: 'increase-water-intake',
    title: 'Increase Water Intake',
    summary: 'Aim for consistent hydration throughout the day.',
    category: 'Lifestyle Guidance',
    priority: 'Low',
    status: 'Active',
    timing: 'Daily',
    frequency: 'Throughout the day',
    duration: 'Ongoing',
    icon: 'water-outline',
    accentColor: '#06B6D4',
    iconBackgroundColor: '#CFFAFE',
    reason:
      'Overall hydration supports skin health. While topical care is primary, adequate water intake complements your skincare routine.',
    steps: [
      'Keep a water bottle accessible during the day.',
      'Aim for steady intake rather than large amounts at once.',
      'Pair hydration with a balanced diet rich in whole foods.',
      'Track how your skin feels alongside lifestyle changes.',
    ],
    expectedResults:
      'Combined with topical care, you may notice improved overall skin comfort over several weeks.',
    filterTags: ['Daily'],
  },
  {
    id: 'reduce-direct-sun-exposure',
    title: 'Reduce Direct Sun Exposure',
    summary: 'Seek shade and wear protective clothing during peak hours.',
    category: 'Lifestyle Guidance',
    priority: 'Medium',
    status: 'Active',
    timing: 'Daily',
    frequency: 'During outdoor activity',
    duration: 'Ongoing',
    icon: 'umbrella-outline',
    accentColor: '#F97316',
    iconBackgroundColor: '#FFEDD5',
    reason:
      'UV exposure can intensify redness and sensitivity. Reducing direct sun supports the benefits of your SPF routine.',
    steps: [
      'Limit prolonged outdoor exposure between 10 AM and 4 PM when possible.',
      'Wear a wide-brim hat and sunglasses outdoors.',
      'Use SPF alongside physical protection for best coverage.',
      'Find shade during extended outdoor activities.',
    ],
    expectedResults:
      'May help prevent flare-ups and support more stable skin tone over time.',
    filterTags: ['Daily'],
  },
  {
    id: 'track-possible-triggers',
    title: 'Track Possible Triggers',
    summary: 'Log products, foods, and stress to identify patterns.',
    category: 'Lifestyle Guidance',
    priority: 'Low',
    status: 'In progress',
    timing: 'Daily',
    frequency: 'Daily check-in',
    duration: '2+ weeks',
    icon: 'journal-outline',
    accentColor: '#6366F1',
    iconBackgroundColor: '#E0E7FF',
    reason:
      'Sensitivity and redness can have multiple triggers. Tracking helps you spot patterns and adjust your routine thoughtfully.',
    steps: [
      'Note new products, meals, sleep, and stress levels daily.',
      'Photograph skin every few days under similar lighting.',
      'Review entries weekly for recurring patterns.',
      'Adjust one variable at a time for clearer insights.',
    ],
    expectedResults:
      'Better awareness of personal triggers within 2–3 weeks of consistent tracking.',
    filterTags: ['Daily', 'Weekly'],
  },
  {
    id: 'next-steps',
    title: 'Next Steps',
    summary: 'Track progress and rescan in 2 weeks.',
    category: 'Follow-up',
    priority: 'Medium',
    status: 'Due soon',
    timing: 'Weekly',
    frequency: 'Every 2 weeks',
    duration: 'Ongoing',
    icon: 'calendar',
    accentColor: '#3B82F6',
    iconBackgroundColor: '#EFF6FF',
    reason:
      'Regular rescans help you track changes and refine your routine based on updated AI insights.',
    steps: [
      'Continue your current routine consistently for 2 weeks.',
      'Take progress notes and photos in similar lighting.',
      'Run a new AI skin scan after 14 days.',
      'Compare results and adjust recommendations as needed.',
    ],
    expectedResults:
      'A follow-up scan provides updated insights to guide your next skincare steps.',
    filterTags: ['Weekly'],
  },
  {
    id: 'review-your-routine',
    title: 'Review Your Routine',
    summary: 'Evaluate what is working and simplify if needed.',
    category: 'Follow-up',
    priority: 'Low',
    status: 'Not started',
    timing: 'Weekly',
    frequency: 'Once per week',
    duration: '15 minutes',
    icon: 'clipboard-outline',
    accentColor: '#64748B',
    iconBackgroundColor: '#F1F5F9',
    reason:
      'A periodic review ensures your routine stays effective and avoids unnecessary product overlap.',
    steps: [
      'List all current products and how often you use them.',
      'Identify any products causing irritation or redundancy.',
      'Keep core steps: cleanse, treat, moisturize, protect.',
      'Adjust based on your latest scan and how your skin feels.',
    ],
    expectedResults:
      'A simpler, more focused routine that is easier to maintain consistently.',
    filterTags: ['Weekly'],
  },
  {
    id: 'consult-a-dermatologist',
    title: 'Consult a Dermatologist',
    summary: 'Seek professional advice for persistent or worsening concerns.',
    category: 'Follow-up',
    priority: 'Conditional',
    status: 'Conditional',
    timing: 'As needed',
    frequency: 'When symptoms persist',
    duration: 'As advised',
    icon: 'medical-outline',
    accentColor: '#8B5CF6',
    iconBackgroundColor: '#EDE9FE',
    reason:
      'If redness, dryness, or sensitivity persists despite consistent care, a dermatologist can provide personalized medical guidance.',
    steps: [
      'Prepare a list of products used and any known reactions.',
      'Bring photos of your skin over the past few weeks.',
      'Describe when symptoms started and any potential triggers.',
      'Follow professional guidance alongside your AI insights.',
    ],
    avoid: ['Self-diagnosing persistent conditions', 'Delaying care if symptoms worsen rapidly'],
    expectedResults:
      'Professional evaluation can clarify underlying causes and appropriate treatment options.',
    filterTags: ['Weekly'],
  },
];

export function getRecommendationById(id: string): Recommendation | undefined {
  return RECOMMENDATIONS.find((item) => item.id === id);
}

export function getPreviewRecommendations(): Recommendation[] {
  return PREVIEW_RECOMMENDATION_IDS.map(
    (id) => RECOMMENDATIONS.find((item) => item.id === id)!,
  ).filter(Boolean);
}

export function filterRecommendations(
  items: Recommendation[],
  filter: 'All' | FilterTag,
): Recommendation[] {
  if (filter === 'All') {
    return items;
  }
  return items.filter((item) => item.filterTags.includes(filter));
}

export function groupRecommendationsByCategory(
  items: Recommendation[],
): Array<{ title: RecommendationCategory; data: Recommendation[] }> {
  return RECOMMENDATION_SECTIONS.map((category) => ({
    title: category,
    data: items.filter((item) => item.category === category),
  })).filter((section) => section.data.length > 0);
}

/** Pre-grouped static sections for the View All screen (all 12 recommendations). */
export const VIEW_ALL_SECTIONS = groupRecommendationsByCategory(RECOMMENDATIONS);

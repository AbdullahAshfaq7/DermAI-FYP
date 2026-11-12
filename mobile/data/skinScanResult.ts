import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type SkinConcernLevel = 'Low' | 'Mild' | 'Moderate' | 'High';

export interface SkinMetric {
  id: string;
  label: string;
  score: number;
  level: SkinConcernLevel;
  description: string;
  icon: IoniconName;
  accentColor: string;
  backgroundColor: string;
}

export interface SkinScanResult {
  id: string;
  scannedAt: string;
  overallScore: number;
  skinType: string;
  summary: string;
  metrics: SkinMetric[];
  keyInsights: string[];
  recommendations: string[];
  nextScanInDays: number;
}

export const STATIC_SKIN_SCAN_RESULT: SkinScanResult = {
  id: 'scan-static-001',
  scannedAt: new Date().toISOString(),
  overallScore: 72,
  skinType: 'Combination and Sensitive',
  summary:
    'Your scan shows generally healthy skin with mild dryness, moderate redness, and some visible sensitivity. Consistent hydration, sun protection, and a gentle routine may help improve your overall skin balance.',
  metrics: [
    {
      id: 'hydration',
      label: 'Hydration',
      score: 64,
      level: 'Mild',
      description: 'Your skin may benefit from additional daily hydration.',
      icon: 'water-outline',
      accentColor: '#0891B2',
      backgroundColor: '#ECFEFF',
    },
    {
      id: 'redness',
      label: 'Redness',
      score: 68,
      level: 'Moderate',
      description: 'Visible redness appears mostly around the cheeks and nose.',
      icon: 'flame-outline',
      accentColor: '#F97316',
      backgroundColor: '#FFF7ED',
    },
    {
      id: 'texture',
      label: 'Texture',
      score: 74,
      level: 'Mild',
      description: 'Your skin texture appears mostly even with a few rough areas.',
      icon: 'grid-outline',
      accentColor: '#7C3AED',
      backgroundColor: '#F5F3FF',
    },
    {
      id: 'dark-spots',
      label: 'Dark Spots',
      score: 60,
      level: 'Mild',
      description: 'A small amount of uneven pigmentation is visible.',
      icon: 'ellipse-outline',
      accentColor: '#D97706',
      backgroundColor: '#FFFBEB',
    },
    {
      id: 'sensitivity',
      label: 'Sensitivity',
      score: 67,
      level: 'Moderate',
      description: 'Your skin may react easily to strong or fragranced products.',
      icon: 'leaf-outline',
      accentColor: '#8B5CF6',
      backgroundColor: '#F5F3FF',
    },
    {
      id: 'pores',
      label: 'Pores',
      score: 69,
      level: 'Moderate',
      description: 'Pores appear slightly more visible around the T-zone.',
      icon: 'scan-outline',
      accentColor: '#0D9488',
      backgroundColor: '#F0FDFA',
    },
  ],
  keyInsights: [
    'Hydration is the main area to improve.',
    'Redness is most visible around the cheeks.',
    'Your skin barrier may benefit from gentle products.',
    'Daily sunscreen can help prevent further uneven tone.',
  ],
  recommendations: [
    'Use a hydrating serum morning and evening.',
    'Apply broad-spectrum SPF 30+ every morning.',
    'Choose a fragrance-free gentle cleanser.',
    'Avoid strong exfoliating acids for the next 7 days.',
    'Rescan in 14 days to track progress.',
  ],
  nextScanInDays: 14,
};

export const SCAN_RECOMMENDATION_IDS = [
  'hydration-boost',
  'sun-protection',
  'gentle-cleanser',
  'avoid-harsh-exfoliation',
  'next-steps',
] as const;

export const ANALYSIS_STAGES = [
  { min: 0, max: 15, label: 'Checking image quality' },
  { min: 16, max: 30, label: 'Mapping facial regions' },
  { min: 31, max: 45, label: 'Analyzing hydration' },
  { min: 46, max: 65, label: 'Detecting redness and texture' },
  { min: 66, max: 85, label: 'Measuring pores and dark spots' },
  { min: 86, max: 100, label: 'Preparing your skin insights' },
] as const;

export const PHOTO_QUALITY_ITEMS = [
  'Face is fully visible',
  'Lighting is even',
  'Image is not blurry',
  'No strong shadows',
  'Minimal makeup if possible',
] as const;

export function formatScanDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getLevelColor(level: SkinConcernLevel): string {
  switch (level) {
    case 'Low':
      return '#10B981';
    case 'Mild':
      return '#3B82F6';
    case 'Moderate':
      return '#F59E0B';
    case 'High':
      return '#EF4444';
    default:
      return '#64748B';
  }
}

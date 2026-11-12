import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface HeroFeature {
  id: string;
  label: string;
  icon: IoniconName;
}

export interface AnalysisMetric {
  id: string;
  label: string;
  value: string;
}

export interface SkinMetric {
  id: string;
  title: string;
  percentage: number;
  severity: string;
  icon: IoniconName;
  color: string;
  trackColor: string;
}

export interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
  backgroundColor: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export interface TabItem {
  id: 'home' | 'scan' | 'chat' | 'profile';
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

export const HERO_FEATURES: HeroFeature[] = [
  { id: 'ai', label: 'Advanced AI', icon: 'sparkles' },
  { id: 'secure', label: 'Private & Secure', icon: 'shield-checkmark' },
  { id: 'guided', label: 'Dermatology Guided', icon: 'medical' },
];

export const ANALYSIS_METRICS: AnalysisMetric[] = [
  { id: 'acne', label: 'Acne', value: 'Medium' },
  { id: 'pores', label: 'Pores', value: 'Low' },
  
  { id: 'hydration', label: 'Hydration', value: 'Fair' },
];

export const SKIN_METRICS: SkinMetric[] = [
  {
    id: 'acne',
    title: 'Acne',
    percentage: 72,
    severity: 'Moderate',
    icon: 'water',
    color: '#3B82F6',
    trackColor: '#DBEAFE',
  },
  {
    id: 'dryness',
    title: 'Dryness',
    percentage: 64,
    severity: 'Mild',
    icon: 'leaf',
    color: '#14B8A6',
    trackColor: '#CCFBF1',
  },
  {
    id: 'redness',
    title: 'Redness',
    percentage: 68,
    severity: 'Moderate',
    icon: 'flame',
    color: '#F472B6',
    trackColor: '#FCE7F3',
  },
  {
    id: 'dark-spots',
    title: 'Dark Spots',
    percentage: 60,
    severity: 'Mild',
    icon: 'ellipse',
    color: '#8B5CF6',
    trackColor: '#EDE9FE',
  },
  {
    id: 'sensitivity',
    title: 'Sensitivity',
    percentage: 67,
    severity: 'Mild',
    icon: 'heart',
    color: '#06B6D4',
    trackColor: '#CFFAFE',
  },
  {
    id: 'pores',
    title: 'Pores',
    percentage: 69,
    severity: 'Moderate',
    icon: 'grid',
    color: '#6366F1',
    trackColor: '#E0E7FF',
  },
];

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'hydration',
    title: 'Hydration Boost',
    subtitle: 'Use a hydrating serum daily',
    icon: 'water',
    color: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },
  {
    id: 'sun',
    title: 'Sun Protection',
    subtitle: 'Apply SPF 30+ every morning',
    icon: 'sunny',
    color: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  {
    id: 'cleanser',
    title: 'Gentle Cleanser',
    subtitle: 'Use a mild, sulfate-free cleanser',
    icon: 'sparkles',
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  {
    id: 'calming',
    title: 'Calming Serum',
    subtitle: 'Niacinamide or Centella can help',
    icon: 'leaf',
    color: '#14B8A6',
    backgroundColor: '#F0FDFA',
  },
  {
    id: 'next',
    title: 'Next Steps',
    subtitle: 'Track progress and rescan in 2 weeks',
    icon: 'calendar',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    text: 'Why do I have redness on my cheeks?',
  },
  {
    id: 'ai-1',
    role: 'ai',
    text: 'Redness can be caused by irritation, sensitivity, sun exposure, or a weakened skin barrier. I recommend using calming products and tracking changes.',
  },
];

export const SUGGESTION_CHIPS: string[] = ['Recommend products', 'Build a routine'];

export const TAB_ITEMS: TabItem[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'scan', label: 'Scan', icon: 'scan-outline', activeIcon: 'scan' },
  { id: 'chat', label: 'Chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export const SKIN_SCORE = 72;

export const INSIGHT_TEXT =
  'Your skin shows signs of mild to moderate dryness, redness, and sensitivity. These results may be influenced by hydration, sun exposure, and your skincare routine.';

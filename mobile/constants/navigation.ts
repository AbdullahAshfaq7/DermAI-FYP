import { Ionicons } from '@expo/vector-icons';
import type { RelativePathString } from 'expo-router';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface NavigationItem {
  name: string;
  label: string;
  route: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}

export const NAVIGATION_COLORS = {
  background: '#FFFFFF',
  active: '#1E56A0',
  inactive: '#94A3B8',
  border: '#EDF2F7',
  scanGradientStart: '#1E56A0',
  scanGradientEnd: '#06B6D4',
} as const;

export const SCAN_GRADIENT = [NAVIGATION_COLORS.scanGradientStart, NAVIGATION_COLORS.scanGradientEnd] as const;

export const APP_ROUTES = {
  tabs: '/(tabs)' as RelativePathString,
  scan: '/scan' as RelativePathString,
  scanReview: '/scan/review' as RelativePathString,
  scanAnalyzing: '/scan/analyzing' as RelativePathString,
  scanResults: '/scan/results' as RelativePathString,
  recommendations: '/recommendations' as RelativePathString,
  recommendationsList: '/recommendations/list' as RelativePathString,
  settings: '/settings' as RelativePathString,
  settingsAppearance: '/settings/appearance' as RelativePathString,
  settingsNotifications: '/settings/notifications' as RelativePathString,
  settingsPrivacy: '/settings/privacy' as RelativePathString,
  settingsAbout: '/settings/about' as RelativePathString,
  notifications: '/notifications' as RelativePathString,
  profile: '/(tabs)/profile' as RelativePathString,
} as const;

export const GLASS_NAV_BAR_HEIGHT = 72;
export const GLASS_BORDER_RADIUS = 30;
export const NAV_HORIZONTAL_MARGIN = 17;
export const NAV_BOTTOM_OFFSET_MIN = 2;
export const NAV_BOTTOM_DOWN_SHIFT = 17;
export const TAB_BAR_HEIGHT = GLASS_NAV_BAR_HEIGHT;
export const CENTER_SCAN_SIZE = 68;
export const CENTER_SCAN_RING_WIDTH = 3.5;
export const CENTER_SCAN_OVERLAP = 24;
export const CENTER_SCAN_ICON_SIZE = 28;
export const CENTER_SCAN_LABEL_SIZE = 10;
export const TAB_ICON_SIZE = 22;
export const TAB_LABEL_SIZE = 10;
export const TAB_ICON_LABEL_GAP = 2;
export const ACTIVE_PILL_WIDTH = 60;
export const ACTIVE_PILL_HEIGHT = 52;
export const ACTIVE_PILL_RADIUS = 20;
export const BOTTOM_NAV_CONTENT_EXTRA = 38;

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'index',
    label: 'Home',
    route: '/(tabs)',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    name: 'routine',
    label: 'Routine',
    route: '/(tabs)/routine',
    activeIcon: 'clipboard',
    inactiveIcon: 'clipboard-outline',
  },
  {
    name: 'chat',
    label: 'Chat',
    route: '/(tabs)/chat',
    activeIcon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
  },
  {
    name: 'profile',
    label: 'Profile',
    route: '/(tabs)/profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

export const LEFT_NAV_ITEMS = NAVIGATION_ITEMS.slice(0, 2);
export const RIGHT_NAV_ITEMS = NAVIGATION_ITEMS.slice(2);

export function getNavBottomOffset(safeAreaBottom: number): number {
  return Math.max(safeAreaBottom - NAV_BOTTOM_DOWN_SHIFT, NAV_BOTTOM_OFFSET_MIN);
}

export function getBottomNavPadding(safeAreaBottom: number, extra = BOTTOM_NAV_CONTENT_EXTRA): number {
  const bottomOffset = getNavBottomOffset(safeAreaBottom);
  const scanRise = CENTER_SCAN_SIZE / 2 - CENTER_SCAN_OVERLAP;
  return bottomOffset + GLASS_NAV_BAR_HEIGHT + scanRise + extra;
}

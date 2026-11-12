import { Ionicons } from '@expo/vector-icons';

export type NotificationCategory = 'scan' | 'recommendation' | 'routine' | 'insight' | 'system';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: NotificationCategory;
  icon: IoniconName;
  accentColor: string;
  iconBackgroundColor: string;
  read: boolean;
  actionRoute?: string;
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'scan-reminder',
    title: 'Time for your next skin scan',
    body: 'It has been 2 weeks since your last scan. Track changes with a quick AI analysis.',
    timestamp: '2h ago',
    category: 'scan',
    icon: 'scan-outline',
    accentColor: '#1E56A0',
    iconBackgroundColor: '#EFF6FF',
    read: false,
    actionRoute: '/scan',
  },
  {
    id: 'new-recommendations',
    title: 'New personalized recommendations',
    body: 'Based on your July 18 scan, we added calming serum and barrier repair guidance.',
    timestamp: '5h ago',
    category: 'recommendation',
    icon: 'sparkles-outline',
    accentColor: '#8B5CF6',
    iconBackgroundColor: '#F5F3FF',
    read: false,
    actionRoute: '/recommendations/list',
  },
  {
    id: 'routine-morning',
    title: 'Morning routine reminder',
    body: 'Apply SPF 30+ and your hydrating serum to stay on track today.',
    timestamp: 'Today, 8:00 AM',
    category: 'routine',
    icon: 'sunny-outline',
    accentColor: '#F59E0B',
    iconBackgroundColor: '#FFFBEB',
    read: false,
    actionRoute: '/(tabs)/routine',
  },
  {
    id: 'redness-insight',
    title: 'Redness trend detected',
    body: 'Your recent scans show mild cheek redness. Consider calming products this week.',
    timestamp: 'Yesterday',
    category: 'insight',
    icon: 'analytics-outline',
    accentColor: '#14B8A6',
    iconBackgroundColor: '#F0FDFA',
    read: true,
    actionRoute: '/(tabs)/chat',
  },
  {
    id: 'hydration-tip',
    title: 'Hydration tip',
    body: 'Dryness scores improved slightly. Keep using your hydrating serum twice daily.',
    timestamp: 'Jul 17',
    category: 'recommendation',
    icon: 'water-outline',
    accentColor: '#06B6D4',
    iconBackgroundColor: '#ECFEFF',
    read: true,
    actionRoute: '/recommendations/detail/hydration-boost',
  },
  {
    id: 'privacy-update',
    title: 'Privacy policy updated',
    body: 'We clarified how scan photos are processed. Review the latest policy anytime in Settings.',
    timestamp: 'Jul 15',
    category: 'system',
    icon: 'shield-checkmark-outline',
    accentColor: '#64748B',
    iconBackgroundColor: '#F1F5F9',
    read: true,
    actionRoute: '/settings/privacy',
  },
];

export function getUnreadNotificationCount(notifications: AppNotification[]): number {
  return notifications.filter((item) => !item.read).length;
}

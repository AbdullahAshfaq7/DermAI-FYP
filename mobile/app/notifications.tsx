import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { RelativePathString } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationsListHeader } from '@/components/notifications/NotificationsListHeader';
import { AppCard } from '@/components/ui/AppCard';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { APP_ROUTES } from '@/constants/navigation';
import { useNotifications } from '@/context/NotificationsContext';
import { AppNotification } from '@/data/notifications';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        emptyWrap: {
          alignItems: 'center',
          paddingVertical: spacing.xxl,
          gap: spacing.sm,
        },
      }),
    [],
  );

  const handleNotificationPress = (notification: AppNotification) => {
    markAsRead(notification.id);

    if (notification.actionRoute) {
      router.push(notification.actionRoute as RelativePathString);
    }
  };

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <NotificationsListHeader
        unreadCount={unreadCount}
        onMarkAllRead={markAllAsRead}
        onOpenSettings={() => router.push(APP_ROUTES.settingsNotifications)}
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={44} color={colors.iconMuted} />
          <AppText variant="subtitle" weight="600">
            No notifications yet
          </AppText>
          <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Scan updates, routine reminders, and recommendations will appear here.
          </AppText>
        </View>
      ) : (
        <AppCard elevated padding="lg">
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              isLast={index === notifications.length - 1}
            />
          ))}
        </AppCard>
      )}
    </AppScreen>
  );
}

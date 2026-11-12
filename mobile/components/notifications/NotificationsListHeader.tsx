import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface NotificationsListHeaderProps {
  unreadCount: number;
  onMarkAllRead?: () => void;
  onOpenSettings?: () => void;
}

export function NotificationsListHeader({
  unreadCount,
  onMarkAllRead,
  onOpenSettings,
}: NotificationsListHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          paddingTop: spacing.sm,
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -4,
        },
        textBlock: {
          flex: 1,
          paddingTop: spacing.xs,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        titleText: {
          flex: 1,
        },
        settingsButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -4,
          marginRight: -spacing.xs,
        },
        actionsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.sm,
        },
        textAction: {
          minHeight: 36,
          justifyContent: 'center',
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [],
  );

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="arrow-back" size={22} color={colors.icon} />
      </Pressable>

      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <AppText variant="title" weight="700" style={{ ...styles.titleText, fontSize: 22 }}>
            Notifications
          </AppText>
          {onOpenSettings ? (
            <Pressable
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Notification settings"
              hitSlop={8}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
              <Ionicons name="settings-outline" size={22} color={colors.icon} />
            </Pressable>
          ) : null}
        </View>
        <AppText variant="body" color="secondary" style={{ marginTop: spacing.xs }}>
          {unreadCount > 0
            ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
            : 'You are all caught up'}
        </AppText>

        {unreadCount > 0 && onMarkAllRead ? (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
              style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
              <AppText variant="caption" color="primary" weight="600">
                Mark all read
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

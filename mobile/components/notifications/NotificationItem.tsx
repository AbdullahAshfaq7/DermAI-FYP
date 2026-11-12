import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { AppNotification } from '@/data/notifications';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/tokens';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  isLast?: boolean;
}

export function NotificationItem({ notification, onPress, isLast = false }: NotificationItemProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.md,
          minHeight: 72,
        },
        unreadRow: {
          backgroundColor: colors.primarySoft,
          marginHorizontal: -spacing.lg,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
          paddingRight: spacing.sm,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          marginTop: 6,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginLeft: 56,
        },
        pressed: {
          opacity: 0.78,
        },
      }),
    [colors],
  );

  return (
    <View>
      <Pressable
        onPress={() => onPress(notification)}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${notification.body}`}
        accessibilityState={{ selected: !notification.read }}
        style={({ pressed }) => [
          styles.row,
          !notification.read && styles.unreadRow,
          pressed && styles.pressed,
        ]}>
        <View
          style={[styles.iconWrap, { backgroundColor: notification.iconBackgroundColor }]}>
          <Ionicons name={notification.icon} size={20} color={notification.accentColor} />
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <AppText variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>
              {notification.timestamp}
            </AppText>
            {!notification.read ? <View style={styles.unreadDot} /> : null}
          </View>
          <AppText variant="body" weight="600" numberOfLines={2}>
            {notification.title}
          </AppText>
          <AppText
            variant="caption"
            color="secondary"
            numberOfLines={2}
            style={{ marginTop: spacing.xs, lineHeight: 18 }}>
            {notification.body}
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.iconMuted} style={{ marginTop: 14 }} />
      </Pressable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

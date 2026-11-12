import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/branding/AppLogo';
import { APP_ROUTES } from '@/constants/navigation';
import { useNotifications } from '@/context/NotificationsContext';
import { createShadowStyle, radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

export function Header() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { colors, isDark, setPreference } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 0,
        },
        logoWrap: {
          flex: 1,
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginRight: spacing.sm,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          flexShrink: 0,
        },
        iconButton: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        badge: {
          position: 'absolute',
          top: 10,
          right: 10,
          width: 8,
          height: 8,
          borderRadius: radius.full,
          backgroundColor: colors.danger,
          borderWidth: 1.5,
          borderColor: colors.surface,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [colors, isDark],
  );

  const handleNotifications = () => {
    router.push(APP_ROUTES.notifications);
  };

  const handleToggleTheme = () => {
    void setPreference(isDark ? 'light' : 'dark');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <AppLogo variant="full" width={136} showTagline />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {unreadCount > 0 ? <View style={styles.badge} /> : null}
        </Pressable>

        <Pressable
          onPress={handleToggleTheme}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

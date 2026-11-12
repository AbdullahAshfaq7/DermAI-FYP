import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppDivider } from '@/components/ui/AppDivider';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { componentHeights, iconSizes, radius, spacing } from '@/theme/tokens';

interface ProfileMenuRowProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
}

export function ProfileMenuRow({
  title,
  subtitle,
  icon,
  onPress,
  isLast = false,
  destructive = false,
}: ProfileMenuRowProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: componentHeights.row,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.md,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
        },
        pressed: {
          backgroundColor: colors.surfaceMuted,
        },
      }),
    [colors, destructive],
  );

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon}
            size={iconSizes.md}
            color={destructive ? colors.danger : colors.primary}
          />
        </View>
        <View style={styles.content}>
          <AppText variant="body" weight="500" color={destructive ? 'danger' : 'primary'}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="secondary" numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} /> : null}
      </Pressable>
      {!isLast ? <AppDivider inset={68} /> : null}
    </>
  );
}

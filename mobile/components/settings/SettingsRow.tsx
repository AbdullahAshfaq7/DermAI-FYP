import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppDivider } from '@/components/ui/AppDivider';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { componentHeights, iconSizes, radius, spacing } from '@/theme/tokens';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  trailing?: ReactNode;
  accessibilityHint?: string;
}

export function SettingsRow({
  title,
  subtitle,
  icon,
  value,
  destructive = false,
  showChevron = true,
  onPress,
  isLast = false,
  trailing,
  accessibilityHint,
}: SettingsRowProps) {
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
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
        },
        value: {
          marginRight: spacing.xs,
        },
        pressed: {
          backgroundColor: colors.surfaceMuted,
        },
      }),
    [colors, destructive],
  );

  const iconColor = destructive ? colors.danger : colors.primary;

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={iconSizes.md} color={iconColor} />
          </View>
        ) : null}
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
        {value ? (
          <AppText variant="caption" color="muted" style={styles.value}>
            {value}
          </AppText>
        ) : null}
        {trailing}
        {showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
        ) : null}
      </Pressable>
      {!isLast ? <AppDivider inset={icon ? 68 : spacing.lg} /> : null}
    </>
  );
}

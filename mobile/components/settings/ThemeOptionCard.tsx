import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import type { ThemePreference } from '@/theme/types';
import { iconSizes, radius, spacing } from '@/theme/tokens';

interface ThemeOptionCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: ThemePreference;
  selected: boolean;
  onSelect: (value: ThemePreference) => void;
}

export function ThemeOptionCard({
  title,
  description,
  icon,
  value,
  selected,
  onSelect,
}: ThemeOptionCardProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          marginBottom: spacing.md,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: selected ? colors.surface : colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          flex: 1,
        },
        radioOuter: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.iconMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioInner: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        pressed: {
          opacity: 0.88,
          transform: [{ scale: 0.99 }],
        },
      }),
    [colors, selected, isDark],
  );

  return (
    <Pressable
      onPress={() => onSelect(value)}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <AppText variant="subtitle" weight="600">
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {description}
        </AppText>
      </View>
      <View style={styles.radioOuter}>{selected ? <View style={styles.radioInner} /> : null}</View>
    </Pressable>
  );
}

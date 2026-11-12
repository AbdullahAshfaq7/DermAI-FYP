import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface OptionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ label, selected, onPress }: OptionCardProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '100%',
          minHeight: 78,
          borderRadius: radius.lg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 8,
          elevation: 2,
          justifyContent: 'center',
        },
        labelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        label: {
          flex: 1,
          fontSize: typography.body,
          color: colors.textPrimary,
          fontWeight: selected ? '700' : '600',
          lineHeight: 22,
        },
        selectedDot: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        selectedIcon: {
          color: colors.surface,
        },
        pressed: {
          opacity: 0.8,
        },
      }),
    [colors, isDark, selected],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.selectedDot}>
          {selected ? <Ionicons name="checkmark" size={12} color={colors.primary} style={styles.selectedIcon} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

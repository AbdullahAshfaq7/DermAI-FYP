import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';
import { createCardStyle, radius, spacing } from '@/theme/tokens';

export function ThemePreviewCard() {
  const { colors, isDark, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...createCardStyle(colors, isDark),
          padding: spacing.lg,
          borderRadius: radius.lg,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        scoreBadge: {
          backgroundColor: colors.primarySoft,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        recommendationRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: radius.sm,
          backgroundColor: colors.infoSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        button: {
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card} accessibilityLabel="Theme preview">
      <View style={styles.header}>
        <AppText variant="subtitle" weight="600">
          Live preview
        </AppText>
        <View style={styles.scoreBadge}>
          <AppText variant="caption" weight="600" color="primary">
            Score 72
          </AppText>
        </View>
      </View>

      <View style={styles.recommendationRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="water-outline" size={16} color={colors.info} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="500">
            Hydration boost
          </AppText>
          <AppText variant="caption" color="secondary">
            Add a lightweight serum tonight
          </AppText>
        </View>
      </View>

      <LinearGradient colors={[...gradients.primaryButton]} style={styles.button}>
        <AppText variant="body" weight="600" color="inverse">
          View recommendation
        </AppText>
      </LinearGradient>
    </View>
  );
}

import { ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface ProfileMenuSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileMenuSection({ title, children }: ProfileMenuSectionProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: spacing.xl,
        },
        title: {
          marginBottom: spacing.sm,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 14,
          overflow: 'hidden',
          ...(isDark ? { borderWidth: 1, borderColor: colors.border } : {}),
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.section}>
      <AppText variant="caption" color="muted" weight="600" style={styles.title} accessibilityRole="header">
        {title.toUpperCase()}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

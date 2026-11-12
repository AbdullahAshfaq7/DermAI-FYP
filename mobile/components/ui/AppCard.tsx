import { ReactNode, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { createCardStyle, radius, spacing } from '@/theme/tokens';

interface AppCardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  muted?: boolean;
  padding?: keyof typeof spacing | number;
}

export function AppCard({
  children,
  style,
  elevated = false,
  muted = false,
  padding = 'lg',
}: AppCardProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...createCardStyle(colors, isDark),
          backgroundColor: muted
            ? colors.surfaceMuted
            : elevated
              ? colors.surfaceElevated
              : colors.surface,
          padding: typeof padding === 'number' ? padding : spacing[padding],
          borderRadius: radius.lg,
        },
      }),
    [colors, isDark, elevated, muted, padding],
  );

  return <View style={[styles.card, style]}>{children}</View>;
}

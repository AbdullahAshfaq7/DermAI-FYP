import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { typography } from '@/theme/tokens';

type AppTextVariant = 'brand' | 'title' | 'subtitle' | 'body' | 'caption' | 'tiny';
type AppTextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'success' | 'warning' | 'info';

interface AppTextProps extends TextProps {
  children: ReactNode;
  variant?: AppTextVariant;
  color?: AppTextColor;
  weight?: '400' | '500' | '600' | '700';
  style?: TextStyle;
}

export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useAppTheme();

  const colorMap = useMemo(
    () => ({
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverse: colors.textInverse,
      danger: colors.danger,
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        text: {
          fontSize: typography[variant],
          color: colorMap[color],
          fontWeight: weight,
        },
      }),
    [variant, colorMap, color, weight],
  );

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
}

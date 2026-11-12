import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';
import { componentHeights, radius, spacing } from '@/theme/tokens';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  children?: ReactNode;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const { colors, resolvedTheme, isDark } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          borderRadius: radius.md,
          overflow: 'hidden',
          minHeight: componentHeights.button,
          opacity: disabled ? 0.5 : 1,
        },
        gradient: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: componentHeights.button,
        },
        secondary: {
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.primarySoft,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: componentHeights.button,
        },
        ghost: {
          backgroundColor: 'transparent',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: componentHeights.button,
        },
        danger: {
          backgroundColor: colors.dangerSoft,
          borderWidth: 1,
          borderColor: isDark ? colors.danger : colors.dangerSoft,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: componentHeights.button,
        },
        pressed: {
          opacity: 0.82,
          transform: [{ scale: 0.98 }],
        },
      }),
    [colors, isDark, disabled],
  );

  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={
            variant === 'primary'
              ? colors.textInverse
              : variant === 'danger'
                ? colors.danger
                : colors.primary
          }
        />
      ) : null}
      <AppText
        variant="subtitle"
        weight="600"
        color={
          variant === 'primary'
            ? 'inverse'
            : variant === 'danger'
              ? 'danger'
              : 'primary'
        }>
        {label}
      </AppText>
    </>
  );

  const variantStyle =
    variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.ghost;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.pressable, style, pressed && !disabled && styles.pressed]}>
      {variant === 'primary' ? (
        <LinearGradient colors={[...gradients.primaryButton]} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        <View style={variantStyle}>{content}</View>
      )}
    </Pressable>
  );
}

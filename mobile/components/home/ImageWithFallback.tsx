import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius } from '@/theme/tokens';

interface ImageWithFallbackProps {
  source: ImageProps['source'];
  style?: StyleProp<ImageStyle>;
  fallbackColors?: readonly [string, string];
  accessibilityLabel?: string;
}

export function ImageWithFallback({
  source,
  style,
  fallbackColors = ['#FDE8D8', '#F5C4A8'],
  accessibilityLabel,
}: ImageWithFallbackProps) {
  const { colors } = useAppTheme();
  const [hasError, setHasError] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fallback: {
          backgroundColor: colors.divider,
          borderRadius: radius.lg,
        },
      }),
    [colors],
  );

  if (hasError) {
    return (
      <LinearGradient
        colors={[fallbackColors[0], fallbackColors[1]]}
        style={[styles.fallback, style]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      accessibilityLabel={accessibilityLabel}
      onError={() => setHasError(true)}
    />
  );
}

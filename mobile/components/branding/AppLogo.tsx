import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { IMAGES } from '@/constants/images';

export interface AppLogoProps {
  variant?: 'full' | 'mark';
  width?: number;
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const FULL_LOGO_ASPECT = 126 / 84;

export function AppLogo({
  variant = 'full',
  width = 140,
  showTagline = true,
  style,
  imageStyle,
}: AppLogoProps) {
  const dimensions = useMemo(() => {
    if (variant === 'mark') {
      return { width, height: width };
    }

    const scaledWidth = showTagline ? width : width * 0.82;
    return {
      width: scaledWidth,
      height: scaledWidth / FULL_LOGO_ASPECT,
    };
  }, [showTagline, variant, width]);

  const source = variant === 'mark' ? IMAGES.dermaiLogoMark : IMAGES.dermaiLogo;
  const accessibilityLabel =
    variant === 'mark' ? 'dermAI' : 'dermAI, AI Skin Insights';

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[dimensions, imageStyle]}
        contentFit="contain"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

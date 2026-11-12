import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRANDED_SPLASH_DURATION_MS, SPLASH_BACKGROUND } from '@/constants/branding';
import { COLORS, FONT } from '@/constants/homeTheme';
import { IMAGES } from '@/constants/images';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';

type BrandedSplashScreenProps = {
  onFinish: () => void;
};

export function BrandedSplashScreen({ onFinish }: BrandedSplashScreenProps) {
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [glowAnim] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    });

    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    fadeIn.start();
    glowPulse.start();

    const timer = setTimeout(onFinish, BRANDED_SPLASH_DURATION_MS);

    return () => {
      fadeIn.stop();
      glowPulse.stop();
      clearTimeout(timer);
    };
  }, [fadeAnim, glowAnim, onFinish]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading dermAI">
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.glowWrap, { opacity: glowAnim }]}>
          <LinearGradient
            colors={['rgba(30, 86, 160, 0.1)', 'rgba(6, 182, 212, 0.16)']}
            style={styles.glow}
          />
        </Animated.View>

        <Image
          source={IMAGES.nativeSplash}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="dermAI splash screen"
        />
      </Animated.View>

      <ActivityIndicator
        size="small"
        color={COLORS.primary}
        style={[styles.loader, { marginBottom: Math.max(insets.bottom, 24) }]}
        accessibilityLabel="Loading"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...ABSOLUTE_FILL_STYLE,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    ...ABSOLUTE_FILL_STYLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    ...ABSOLUTE_FILL_STYLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  logo: {
    ...ABSOLUTE_FILL_STYLE,
  },
  tagline: {
    marginTop: 16,
    fontSize: FONT.subtitle,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    bottom: 0,
  },
});

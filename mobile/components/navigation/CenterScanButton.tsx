import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  CENTER_SCAN_ICON_SIZE,
  CENTER_SCAN_OVERLAP,
  CENTER_SCAN_RING_WIDTH,
  CENTER_SCAN_SIZE,
  SCAN_GRADIENT,
} from '@/constants/navigation';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';

export interface CenterScanButtonProps {
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ICON_PULSE_MIN = 0.86;
const ICON_PULSE_MAX = 1;

export function CenterScanButton({ active, onPress, isDark }: CenterScanButtonProps) {
  const pressScale = useSharedValue(1);
  const iconPulseScale = useSharedValue(ICON_PULSE_MAX);
  const iconPressScale = useSharedValue(1);

  useEffect(() => {
    iconPulseScale.value = withRepeat(
      withSequence(
        withTiming(ICON_PULSE_MIN, {
          duration: active ? 2400 : 2000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(ICON_PULSE_MAX, {
          duration: active ? 2400 : 2000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [active, iconPulseScale]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulseScale.value * iconPressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.set(withSpring(0.94, { damping: 16, stiffness: 420 }));
    iconPressScale.set(withSpring(0.9, { damping: 16, stiffness: 420 }));
  };

  const handlePressOut = () => {
    pressScale.set(withSpring(1, { damping: 14, stiffness: 320 }));
    iconPressScale.set(withSpring(1, { damping: 14, stiffness: 320 }));
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          top: -(CENTER_SCAN_SIZE / 2) + CENTER_SCAN_OVERLAP,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 10,
        },
        buttonWrap: {
          alignItems: 'center',
        },
        button: {
          width: CENTER_SCAN_SIZE,
          height: CENTER_SCAN_SIZE,
          borderRadius: CENTER_SCAN_SIZE / 2,
          overflow: 'hidden',
          borderWidth: CENTER_SCAN_RING_WIDTH,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.94)',
          ...Platform.select({
            ios: {
              shadowColor: isDark ? '#32C6D4' : 'rgba(19, 42, 65, 0.28)',
              shadowOffset: { width: 0, height: isDark ? 5 : 7 },
              shadowOpacity: isDark ? 0.38 : 0.24,
              shadowRadius: isDark ? 9 : 11,
            },
            android: {
              elevation: 8,
            },
            default: {},
          }),
        },
        gradientBackground: {
          ...ABSOLUTE_FILL_STYLE,
        },
        buttonContent: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        innerHighlight: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: CENTER_SCAN_SIZE * 0.42,
          borderTopLeftRadius: CENTER_SCAN_SIZE / 2,
          borderTopRightRadius: CENTER_SCAN_SIZE / 2,
        },
      }),
    [isDark],
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.buttonWrap}>
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel="Start AI skin scan"
          accessibilityHint="Opens the camera to capture a skin scan"
          accessibilityState={{ selected: active }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[styles.button, buttonAnimatedStyle]}>
          <LinearGradient
            colors={[...SCAN_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.innerHighlight}
            pointerEvents="none"
          />
          <View style={styles.buttonContent}>
            <Animated.View style={iconAnimatedStyle}>
              <Ionicons name="scan-outline" size={CENTER_SCAN_ICON_SIZE} color="#FFFFFF" />
            </Animated.View>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HERO_FEATURES } from '@/data/homeMockData';
import { getThemeGradients } from '@/theme/colors';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const SCAN_POINTS = [
  { top: '18%', left: '42%' },
  { top: '32%', left: '58%' },
  { top: '62%', left: '28%' },
  { top: '55%', left: '52%' },
  { top: '60%', left: '75%' },
];

const BRACKET_SIZE = 16;
const BRACKET_WIDTH = 2;
const HERO_CARD_RADIUS = 28;

export function HeroScanCard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const { colors, isDark, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: HERO_CARD_RADIUS,
          padding: spacing.md,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        content: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        contentCompact: {
          flexDirection: 'column',
        },
        leftColumn: {
          flex: 1,
          justifyContent: 'center',
          paddingRight: spacing.xs,
        },
        leftColumnCompact: {
          paddingRight: 0,
        },
        heading: {
          fontSize: typography.title + 2,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 26,
          marginBottom: spacing.xs,
        },
        supportingText: {
          fontSize: typography.body,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.md,
        },
        features: {
          gap: spacing.sm,
        },
        featureItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        featureIcon: {
          width: 24,
          height: 24,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        featureLabel: {
          fontSize: typography.caption,
          color: colors.textPrimary,
          fontWeight: '500',
          flexShrink: 1,
        },
        rightColumn: {
          width: '42%',
          minWidth: 130,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rightColumnCompact: {
          width: '100%',
          minWidth: undefined,
        },
        faceContainer: {
          width: '100%',
          aspectRatio: 0.85,
          maxHeight: 180,
          position: 'relative',
          overflow: 'hidden',
        },
        faceImage: {
          width: '100%',
          height: '100%',
          borderRadius: radius.xl,
        },
        bracket: {
          position: 'absolute',
          width: BRACKET_SIZE,
          height: BRACKET_SIZE,
          borderColor: colors.secondary,
        },
        bracketTopLeft: {
          top: 8,
          left: 8,
          borderTopWidth: BRACKET_WIDTH,
          borderLeftWidth: BRACKET_WIDTH,
          borderTopLeftRadius: 4,
        },
        bracketTopRight: {
          top: 8,
          right: 8,
          borderTopWidth: BRACKET_WIDTH,
          borderRightWidth: BRACKET_WIDTH,
          borderTopRightRadius: 4,
        },
        bracketBottomLeft: {
          bottom: 8,
          left: 8,
          borderBottomWidth: BRACKET_WIDTH,
          borderLeftWidth: BRACKET_WIDTH,
          borderBottomLeftRadius: 4,
        },
        bracketBottomRight: {
          bottom: 8,
          right: 8,
          borderBottomWidth: BRACKET_WIDTH,
          borderRightWidth: BRACKET_WIDTH,
          borderBottomRightRadius: 4,
        },
        scanPoint: {
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: radius.full,
          backgroundColor: colors.secondary,
          borderWidth: 1.5,
          borderColor: colors.surface,
          marginLeft: -3,
          marginTop: -3,
        },
        analysisCard: {
          position: 'absolute',
          bottom: 3,
          right: -2,
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          minWidth: 88,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        analysisRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 2,
          gap: spacing.sm,
        },
        analysisRowBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.divider,
        },
        analysisLabel: {
          fontSize: typography.tiny,
          color: colors.textSecondary,
        },
        analysisValue: {
          fontSize: typography.tiny,
          color: colors.primary,
          fontWeight: '600',
        },
        scanButtonWrapper: {
          borderRadius: radius.lg,
          overflow: 'hidden',
        },
        scanButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          minHeight: 52,
        },
        scanButtonText: {
          fontSize: typography.subtitle,
          fontWeight: '600',
          color: colors.textInverse,
        },
        pressed: {
          opacity: 0.88,
        },
      }),
    [colors, isDark],
  );

  const handleScan = () => {
    router.push('/pre-scan');
  };

  return (
    <LinearGradient
      colors={[...gradients.hero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <View style={[styles.leftColumn, isCompact && styles.leftColumnCompact]}>
          <Text style={styles.heading}>Smart scan. Real insights.</Text>
          <Text style={styles.supportingText} numberOfLines={3}>
            AI-powered analysis of your skin health in seconds.
          </Text>

          <View style={styles.features}>
            {HERO_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={12} color={colors.primary} />
                </View>
                <Text style={styles.featureLabel} numberOfLines={1}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.rightColumn, isCompact && styles.rightColumnCompact]}>
          <View style={styles.faceContainer}>
            <ImageBackground
              source={require('../../assets/images/scan-face.png')}
              style={styles.faceImage}
              imageStyle={{ borderRadius: radius.xl }}
              resizeMode="cover"
              accessibilityLabel="Skin scan model"
            />

            <View style={[styles.bracket, styles.bracketTopLeft]} />
            <View style={[styles.bracket, styles.bracketTopRight]} />
            <View style={[styles.bracket, styles.bracketBottomLeft]} />
            <View style={[styles.bracket, styles.bracketBottomRight]} />

            {SCAN_POINTS.map((point, index) => (
              <View
                key={`point-${index}`}
                style={[
                  styles.scanPoint,
                  { top: point.top as `${number}%`, left: point.left as `${number}%` },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleScan}
        accessibilityRole="button"
        accessibilityLabel="Scan My Skin"
        style={({ pressed }) => [styles.scanButtonWrapper, pressed && styles.pressed]}>
        <LinearGradient
          colors={[...gradients.primaryButton]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.scanButton}>
          <Ionicons name="scan" size={20} color={colors.textInverse} />
          <Text style={styles.scanButtonText}>Scan My Skin</Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

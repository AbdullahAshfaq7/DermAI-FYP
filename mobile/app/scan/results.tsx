import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationPreviewRow } from '@/components/recommendations/RecommendationPreviewRow';
import { ScanDisclaimer } from '@/components/scan/ScanDisclaimer';
import { ScanInsightsCard } from '@/components/scan/ScanInsightsCard';
import { ScanResultActions } from '@/components/scan/ScanResultActions';
import { SkinMetricCard } from '@/components/scan/SkinMetricCard';
import { SkinScoreCard } from '@/components/scan/SkinScoreCard';
import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { APP_ROUTES } from '@/constants/navigation';
import { SCAN_RECOMMENDATION_IDS } from '@/data/skinScanResult';
import { RECOMMENDATIONS } from '@/data/recommendations';
import { useScan } from '@/context/ScanContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle } from '@/theme/tokens';

function createResultsStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  isDark: boolean,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    content: {
      paddingHorizontal: SPACING.md,
      gap: SPACING.lg,
    },
    section: {
      gap: SPACING.sm + 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summaryCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      ...(isDark
        ? { borderWidth: 1, borderColor: colors.border }
        : createShadowStyle(colors, isDark, 'soft')),
    },
    summaryText: {
      fontSize: FONT.body,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm + 4,
    },
    recommendationsCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      ...(isDark
        ? { borderWidth: 1, borderColor: colors.border }
        : createShadowStyle(colors, isDark, 'card')),
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewAllText: {
      fontSize: FONT.caption + 1,
      fontWeight: '600',
      color: colors.primary,
    },
    viewAllLink: {
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
    viewAllLinkText: {
      fontSize: FONT.body,
      fontWeight: '600',
      color: colors.primary,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

export default function ScanResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    session,
    saveFeedback,
    saveScanResult,
    resetForRescan,
    clearSaveFeedback,
    isCurrentScanSaved,
  } = useScan();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createResultsStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    if (!session.result || session.analysisStatus !== 'completed') {
      router.replace(APP_ROUTES.scan);
    }
  }, [router, session.analysisStatus, session.result]);

  useEffect(() => {
    if (!saveFeedback) {
      return;
    }
    const timer = setTimeout(clearSaveFeedback, 3000);
    return () => clearTimeout(timer);
  }, [clearSaveFeedback, saveFeedback]);

  const handleClose = useCallback(() => {
    router.replace(APP_ROUTES.tabs);
  }, [router]);

  const handleSave = useCallback(() => {
    saveScanResult();
  }, [saveScanResult]);

  const handleScanAgain = useCallback(() => {
    resetForRescan();
    router.replace(APP_ROUTES.scan);
  }, [resetForRescan, router]);

  const handleGoHome = useCallback(() => {
    router.replace(APP_ROUTES.tabs);
  }, [router]);

  const handleViewRecommendations = useCallback(() => {
    router.push(APP_ROUTES.recommendations);
  }, [router]);

  if (!session.result || !session.photoUri) {
    return null;
  }

  const { result } = session;
  const linkedRecommendations = SCAN_RECOMMENDATION_IDS.map((id) =>
    RECOMMENDATIONS.find((item) => item.id === id),
  ).filter((item): item is (typeof RECOMMENDATIONS)[number] => Boolean(item));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close results"
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Your Skin Scan</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share scan results"
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="share-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}>
          <SkinScoreCard
            photoUri={session.photoUri}
            overallScore={result.overallScore}
            skinType={result.skinType}
            scannedAt={result.scannedAt}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your skin at a glance</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skin Overview</Text>
            <View style={styles.metricsGrid}>
              {result.metrics.map((metric) => (
                <SkinMetricCard key={metric.id} metric={metric} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key insights</Text>
            <ScanInsightsCard insights={result.keyInsights} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <Pressable
                onPress={handleViewRecommendations}
                accessibilityRole="button"
                accessibilityLabel="View all recommendations"
                style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.recommendationsCard}>
              {linkedRecommendations.map((recommendation, index) => (
                <RecommendationPreviewRow
                  key={recommendation.id}
                  recommendation={recommendation}
                  showDivider={index < linkedRecommendations.length - 1}
                />
              ))}
            </View>

            <Pressable
              onPress={handleViewRecommendations}
              accessibilityRole="button"
              accessibilityLabel="View all recommendations"
              style={({ pressed }) => [styles.viewAllLink, pressed && styles.pressed]}>
              <Text style={styles.viewAllLinkText}>View All Recommendations</Text>
            </Pressable>
          </View>

          <ScanDisclaimer />
          <ScanResultActions
            onSave={handleSave}
            onScanAgain={handleScanAgain}
            onGoHome={handleGoHome}
            isSaved={isCurrentScanSaved()}
            saveFeedback={saveFeedback}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

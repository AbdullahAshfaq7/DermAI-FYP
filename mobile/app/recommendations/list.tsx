import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { RecommendationFilterChips } from '@/components/recommendations/RecommendationFilterChips';
import { RecommendationSectionHeader } from '@/components/recommendations/RecommendationSectionHeader';
import { RecommendationSummaryCard } from '@/components/recommendations/RecommendationSummaryCard';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing, typography } from '@/theme/tokens';
import {
  FilterTag,
  RECOMMENDATIONS,
  filterRecommendations,
  groupRecommendationsByCategory,
} from '@/data/recommendations';

export default function RecommendationsListScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<'All' | FilterTag>('All');

  const sections = useMemo(() => {
    const filtered = filterRecommendations(RECOMMENDATIONS, activeFilter);
    return groupRecommendationsByCategory(filtered);
  }, [activeFilter]);

  const isEmpty = sections.length === 0;
  const totalCount = sections.reduce((sum, section) => sum + section.data.length, 0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeArea: {
          flex: 1,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -spacing.sm,
        },
        headerText: {
          flex: 1,
          paddingTop: spacing.xs,
        },
        title: {
          fontSize: typography.title + 2,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        subtitle: {
          fontSize: typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xs,
          lineHeight: 17,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        },
        resultCount: {
          fontSize: typography.caption,
          color: colors.textMuted,
          marginBottom: spacing.xs,
          fontWeight: '500',
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        emptyTitle: {
          fontSize: typography.subtitle,
          fontWeight: '600',
          color: colors.textPrimary,
          marginTop: spacing.sm,
        },
        emptyBody: {
          fontSize: typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        emptyButton: {
          marginTop: spacing.sm,
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.primary,
          borderRadius: 999,
        },
        emptyButtonText: {
          fontSize: typography.caption,
          fontWeight: '600',
          color: colors.textInverse,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Your Recommendations</Text>
            <Text style={styles.subtitle}>Personalized from your latest skin scan</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <RecommendationSummaryCard />

          <RecommendationFilterChips
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {!isEmpty && (
            <Text style={styles.resultCount}>
              {totalCount} recommendation{totalCount === 1 ? '' : 's'}
            </Text>
          )}

          {isEmpty ? (
            <View style={styles.emptyState}>
              <Ionicons name="filter-outline" size={40} color={colors.iconMuted} />
              <Text style={styles.emptyTitle}>No recommendations found</Text>
              <Text style={styles.emptyBody}>
                Try selecting a different filter to see more suggestions.
              </Text>
              <Pressable
                onPress={() => setActiveFilter('All')}
                accessibilityRole="button"
                accessibilityLabel="Show all recommendations"
                style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                <Text style={styles.emptyButtonText}>Show all</Text>
              </Pressable>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.title}>
                <RecommendationSectionHeader title={section.title} count={section.data.length} />
                {section.data.map((item) => (
                  <RecommendationCard key={item.id} recommendation={item} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

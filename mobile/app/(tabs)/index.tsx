import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DermAIChatPreview } from '@/components/home/DermAIChatPreview';
import { Header } from '@/components/home/Header';
import { HeroScanCard } from '@/components/home/HeroScanCard';
import { SkinOverview } from '@/components/home/SkinOverview';
import { useBottomNavPadding } from '@/components/navigation/useBottomNavPadding';
import { RecommendationsPreviewCard } from '@/components/recommendations/RecommendationsPreviewCard';
import { FONT, SPACING } from '@/constants/homeTheme';
import { useAppTheme } from '@/theme/useAppTheme';

function Disclaimer({
  styles,
  iconColor,
}: {
  styles: ReturnType<typeof createStyles>;
  iconColor: string;
}) {
  return (
    <View style={styles.disclaimer}>
      <Ionicons name="information-circle-outline" size={14} color={iconColor} />
      <Text style={styles.disclaimerText}>
        For informational use only — not a medical diagnosis.
      </Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
    },
    mainContent: {
      gap: 0,
    },
    disclaimer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.md,
    },
    disclaimerText: {
      fontSize: FONT.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      flexShrink: 1,
    },
  });
}

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const scrollBottomPadding = useBottomNavPadding();

  const styles = useMemo(() => createStyles(colors), [colors, isDark]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}>
          <Header />
          <HeroScanCard />
          <SkinOverview />

          <View style={styles.mainContent}>
            <RecommendationsPreviewCard />
            <DermAIChatPreview />
          </View>

          <Disclaimer styles={styles} iconColor={colors.textMuted} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionCard } from '@/components/prescan/OptionCard';
import { FONT, SPACING } from '@/constants/homeTheme';
import { createShadowStyle, radius, typography } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const questions = [
  {
    id: 'skinType',
    question: 'How would you describe your skin type?',
    options: ['Oily', 'Dry', 'Combination', 'Normal', 'Not sure'] as const,
  },
  {
    id: 'sensitivity',
    question: 'How sensitive is your skin?',
    options: ['Very sensitive – reacts easily', 'Somewhat sensitive', 'Not sensitive'] as const,
  },
  {
    id: 'routine',
    question: 'Do you currently follow a skincare routine?',
    options: ['No routine', 'Basic – cleanser & moisturizer', 'Full routine – 3+ products'] as const,
  },
] as const;

type Question = typeof questions[number];
type Answer = string | null;

export default function PreScanScreen() {
  const { colors, isDark, resolvedTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<Question['id'], Answer>>({
    skinType: null,
    sensitivity: null,
    routine: null,
  });
  const hasCameraScreen = true;

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
        container: {
          flex: 1,
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + SPACING.lg,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        backButton: {
          minWidth: 80,
          height: 40,
          borderRadius: radius.full,
          paddingHorizontal: SPACING.sm,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACING.xs,
          ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
        },
        backButtonText: {
          fontSize: typography.body,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        skipButton: {
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        skipButtonText: {
          fontSize: typography.caption,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        progressRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        progressText: {
          fontSize: typography.caption,
          color: colors.textSecondary,
        },
        title: {
          fontSize: FONT.title + 2,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 28,
          marginBottom: SPACING.sm,
        },
        question: {
          fontSize: typography.title + 1,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: SPACING.sm,
          lineHeight: 28,
        },
        options: {
          gap: SPACING.sm,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  const currentQuestion = questions[step];
  const selectedValue = answers[currentQuestion.id];

  const handleBack = () => {
    if (step === 0) {
      router.push('/');
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  };

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    if (step < questions.length - 1) {
      setTimeout(() => setStep((current) => current + 1), 250);
      return;
    }

    if (hasCameraScreen) {
      setTimeout(() => router.push('/scan'), 300);
    }
  };

  const handleSkip = () => {
    router.push('/scan');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{`${step + 1} of ${questions.length}`}</Text>
              </View>
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton} accessibilityRole="button" accessibilityLabel="Skip questionnaire">
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Pre-scan questionnaire</Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          <View style={styles.options}>
            {currentQuestion.options.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={selectedValue === option}
                onPress={() => handleSelect(option)}
              />
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

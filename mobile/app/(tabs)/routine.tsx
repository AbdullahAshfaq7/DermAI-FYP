import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavPadding } from '@/components/navigation/useBottomNavPadding';
import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { createShadowStyle } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface RoutineStep {
  id: string;
  title: string;
  completed: boolean;
}

interface RoutineSection {
  id: string;
  title: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  steps: RoutineStep[];
}

const ROUTINE_SECTIONS: RoutineSection[] = [
  {
    id: 'morning',
    title: 'Morning Routine',
    time: '7:00 AM reminder',
    icon: 'sunny-outline',
    steps: [
      { id: 'm1', title: 'Gentle cleanser', completed: true },
      { id: 'm2', title: 'Hydrating serum', completed: true },
      { id: 'm3', title: 'SPF 30+ moisturizer', completed: false },
    ],
  },
  {
    id: 'night',
    title: 'Night Routine',
    time: '9:30 PM reminder',
    icon: 'moon-outline',
    steps: [
      { id: 'n1', title: 'Double cleanse', completed: false },
      { id: 'n2', title: 'Niacinamide serum', completed: false },
      { id: 'n3', title: 'Barrier repair cream', completed: false },
    ],
  },
];

type RoutineStyles = ReturnType<typeof createRoutineStyles>;

function createRoutineStyles(
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
    content: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
    },
    title: {
      fontSize: FONT.title + 4,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT.body,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
    },
    reminderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
    },
    reminderText: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: FONT.subtitle,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    reminderBody: {
      fontSize: FONT.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'card')),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: FONT.subtitle,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardTime: {
      fontSize: FONT.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    progressText: {
      fontSize: FONT.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      minHeight: 44,
      paddingVertical: SPACING.sm,
    },
    stepText: {
      fontSize: FONT.body,
      color: colors.textPrimary,
    },
    stepTextCompleted: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

function RoutineCard({
  section,
  styles,
  onToggleStep,
}: {
  section: RoutineSection;
  styles: RoutineStyles;
  onToggleStep: (sectionId: string, stepId: string) => void;
}) {
  const { colors } = useAppTheme();
  const completedCount = section.steps.filter((step) => step.completed).length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardIcon}>
            <Ionicons name={section.icon} size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardTime}>{section.time}</Text>
          </View>
        </View>
        <Text style={styles.progressText}>
          {completedCount}/{section.steps.length}
        </Text>
      </View>

      {section.steps.map((step) => (
        <Pressable
          key={step.id}
          onPress={() => onToggleStep(section.id, step.id)}
          accessibilityRole="button"
          accessibilityLabel={step.title}
          style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}>
          <Ionicons
            name={step.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={step.completed ? colors.secondary : colors.iconMuted}
          />
          <Text style={[styles.stepText, step.completed && styles.stepTextCompleted]}>
            {step.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function RoutineScreen() {
  const { colors, isDark } = useAppTheme();
  const [routineSections, setRoutineSections] = useState(() => ROUTINE_SECTIONS);
  const scrollBottomPadding = useBottomNavPadding();
  const styles = useMemo(() => createRoutineStyles(colors, isDark), [colors, isDark]);

  const handleToggleStep = (sectionId: string, stepId: string) => {
    setRoutineSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              steps: section.steps.map((step) =>
                step.id !== stepId ? step : { ...step, completed: !step.completed },
              ),
            },
      ),
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Skincare Routine</Text>
          <Text style={styles.subtitle}>Track your morning and night steps</Text>

          <View style={styles.reminderCard}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <View style={styles.reminderText}>
              <Text style={styles.reminderTitle}>Reminders enabled</Text>
              <Text style={styles.reminderBody}>Stay consistent with daily routine alerts</Text>
            </View>
          </View>

          {routineSections.map((section) => (
            <RoutineCard
              key={section.id}
              section={section}
              styles={styles}
              onToggleStep={handleToggleStep}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

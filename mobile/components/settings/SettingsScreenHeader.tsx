import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface SettingsScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function SettingsScreenHeader({ title, subtitle }: SettingsScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.xl,
          paddingTop: spacing.sm,
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -4,
        },
        textBlock: {
          flex: 1,
          paddingTop: spacing.xs,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [],
  );

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="arrow-back" size={22} color={colors.icon} />
      </Pressable>
      <View style={styles.textBlock}>
        <AppText variant="title" weight="700" style={{ fontSize: 22 }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="secondary" style={{ marginTop: spacing.xs }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

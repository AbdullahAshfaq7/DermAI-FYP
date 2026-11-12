import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/branding/AppLogo';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { AppCard } from '@/components/ui/AppCard';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

export default function AboutSettingsScreen() {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          alignItems: 'center',
          marginBottom: spacing.xl,
        },
        logo: {
          width: 96,
          height: 96,
          marginBottom: spacing.md,
        },
        tagline: {
          marginTop: spacing.xs,
        },
        version: {
          marginTop: spacing.sm,
        },
        description: {
          marginBottom: spacing.xl,
        },
      }),
    [],
  );

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SettingsScreenHeader title="About dermAI" />

      <View style={styles.hero}>
        <AppLogo variant="mark" width={96} style={styles.logo} />
        <AppText variant="title" weight="700">
          dermAI
        </AppText>
        <AppText variant="subtitle" color="secondary" style={styles.tagline}>
          AI Skin Insights
        </AppText>
        <AppText variant="caption" color="muted" style={styles.version}>
          Version 1.0.0
        </AppText>
      </View>

      <AppText variant="body" color="secondary" style={styles.description}>
        dermAI helps you understand your skin with AI-powered scans, personalized routines, and
        calm, trustworthy guidance designed for everyday skincare decisions.
      </AppText>

      <SettingsSection title="Legal & support">
        <SettingsRow
          title="Privacy Policy"
          icon="document-text-outline"
          onPress={() => Linking.openURL('https://example.com/privacy')}
        />
        <SettingsRow
          title="Terms of Use"
          icon="reader-outline"
          onPress={() => Linking.openURL('https://example.com/terms')}
        />
        <SettingsRow
          title="Contact Support"
          icon="mail-outline"
          onPress={() => Linking.openURL('mailto:support@dermai.example.com')}
          isLast
        />
      </SettingsSection>

      <AppCard muted style={{ marginTop: spacing.lg }}>
        <AppText variant="caption" color="muted" weight="600" style={{ marginBottom: spacing.sm }}>
          MEDICAL DISCLAIMER
        </AppText>
        <AppText variant="body" color="secondary">
          dermAI provides informational skin insights and does not replace professional medical
          advice, diagnosis, or treatment.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}

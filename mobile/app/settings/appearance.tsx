import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { ThemeOptionCard } from '@/components/settings/ThemeOptionCard';
import { ThemePreviewCard } from '@/components/settings/ThemePreviewCard';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import type { ThemePreference } from '@/theme/types';
import { spacing } from '@/theme/tokens';

const THEME_OPTIONS: {
  value: ThemePreference;
  title: string;
  description: string;
  icon: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
}[] = [
  {
    value: 'light',
    title: 'Light',
    description: 'Use the light appearance',
    icon: 'sunny-outline',
  },
  {
    value: 'dark',
    title: 'Dark',
    description: 'Use the dark appearance',
    icon: 'moon-outline',
  },
  {
    value: 'system',
    title: 'System default',
    description: 'Match your device settings',
    icon: 'phone-portrait-outline',
  },
];

export default function AppearanceSettingsScreen() {
  const { preference, setPreference } = useAppTheme();

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SettingsScreenHeader
        title="Appearance"
        subtitle="Choose how dermAI looks on this device."
      />

      {THEME_OPTIONS.map((option) => (
        <ThemeOptionCard
          key={option.value}
          title={option.title}
          description={option.description}
          icon={option.icon}
          value={option.value}
          selected={preference === option.value}
          onSelect={setPreference}
        />
      ))}

      <ThemePreviewCard />

      <AppText variant="caption" color="muted" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
        Your appearance preference is saved on this device.
      </AppText>
    </AppScreen>
  );
}

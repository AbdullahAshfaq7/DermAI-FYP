import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { AppScreen } from '@/components/ui/AppScreen';
import { APP_ROUTES } from '@/constants/navigation';
import { useAppTheme } from '@/theme/useAppTheme';
import { getPreferenceLabel } from '@/theme/utils';
import { spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { preference } = useAppTheme();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This action cannot be undone. Your local profile data would be removed in a connected version of dermAI.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ],
    );
  };

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SettingsScreenHeader title="Settings" />

      <SettingsSection title="Appearance">
        <SettingsRow
          title="Appearance"
          subtitle="Theme and display preferences"
          icon="color-palette-outline"
          value={getPreferenceLabel(preference)}
          onPress={() => router.push(APP_ROUTES.settingsAppearance)}
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow
          title="Notifications"
          icon="notifications-outline"
          onPress={() => router.push(APP_ROUTES.settingsNotifications)}
        />
        <SettingsRow title="Scan reminders" icon="scan-outline" value="On" onPress={() => router.push('/settings/notifications')} />
        <SettingsRow
          title="Routine reminders"
          icon="alarm-outline"
          value="On"
          isLast
          onPress={() => router.push(APP_ROUTES.settingsNotifications)}
        />
      </SettingsSection>

      <SettingsSection title="Privacy & Security">
        <SettingsRow
          title="Privacy & Security"
          icon="shield-checkmark-outline"
          onPress={() => router.push(APP_ROUTES.settingsPrivacy)}
        />
        <SettingsRow title="Data and permissions" icon="document-text-outline" onPress={() => router.push('/settings/privacy')} />
        <SettingsRow
          title="Camera permissions"
          icon="camera-outline"
          value="Allowed"
          isLast
          onPress={() => router.push(APP_ROUTES.settingsPrivacy)}
        />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsRow title="Language" icon="language-outline" value="English" showChevron={false} />
        <SettingsRow title="About dermAI" icon="information-circle-outline" onPress={() => router.push(APP_ROUTES.settingsAbout)} />
        <SettingsRow title="App version" icon="code-slash-outline" value="1.0.0" showChevron={false} isLast />
      </SettingsSection>

      <SettingsSection title="Danger zone">
        <SettingsRow
          title="Delete Account"
          icon="trash-outline"
          destructive
          showChevron={false}
          isLast
          onPress={handleDeleteAccount}
        />
      </SettingsSection>
    </AppScreen>
  );
}

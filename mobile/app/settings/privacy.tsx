import { Alert } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { AppCard } from '@/components/ui/AppCard';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';

export default function PrivacySettingsScreen() {
  const confirmDestructive = (title: string, message: string, action: string) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => console.log(action) },
    ]);
  };

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SettingsScreenHeader
        title="Privacy & Security"
        subtitle="Manage how your data is stored and protected on this device."
      />

      <AppCard style={{ marginBottom: spacing.xl }}>
        <AppText variant="body" color="secondary">
          Your skin photos and scan results should be handled securely. This static version does not
          upload data to a server.
        </AppText>
      </AppCard>

      <SettingsSection title="Privacy">
        <SettingsRow title="Camera permissions" icon="camera-outline" value="Allowed" />
        <SettingsRow title="Photo storage preferences" icon="images-outline" value="On device" />
        <SettingsRow title="Skin scan data" icon="analytics-outline" subtitle="Stored locally only" />
        <SettingsRow
          title="Personalization data"
          icon="sparkles-outline"
          subtitle="Used to tailor recommendations"
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow title="Change password" icon="key-outline" />
        <SettingsRow title="App lock" icon="lock-closed-outline" value="Off" />
        <SettingsRow title="Manage devices" icon="phone-portrait-outline" isLast />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow title="Export my data" icon="download-outline" />
        <SettingsRow
          title="Delete scan history"
          icon="time-outline"
          destructive
          onPress={() =>
            confirmDestructive(
              'Delete scan history',
              'All saved scan history on this device would be removed.',
              'Delete history',
            )
          }
        />
        <SettingsRow
          title="Delete account"
          icon="trash-outline"
          destructive
          showChevron={false}
          isLast
          onPress={() =>
            confirmDestructive(
              'Delete account',
              'This permanently removes your account in a connected version of dermAI.',
              'Delete account',
            )
          }
        />
      </SettingsSection>
    </AppScreen>
  );
}

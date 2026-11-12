import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useBottomNavPadding } from '@/components/navigation/useBottomNavPadding';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileMenuSection } from '@/components/profile/ProfileMenuSection';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppScreen';
import { APP_ROUTES } from '@/constants/navigation';
import { spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const scrollBottomPadding = useBottomNavPadding();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of dermAI on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => console.log('Logged out') },
    ]);
  };

  return (
    <AppScreen
      scroll
      contentContainerStyle={{ paddingBottom: scrollBottomPadding, paddingTop: spacing.md }}>
      <ProfileHeader title="Profile" onEditPress={() => console.log('Edit profile header')} />

      <ProfileIdentityCard
        name="Sophia Williams"
        email="sophia@example.com"
        status="Skin profile updated"
        onEditProfile={() => console.log('Edit profile')}
      />

      <ProfileMenuSection title="Account">
        <ProfileMenuRow title="Personal Information" icon="person-outline" onPress={() => console.log('Personal info')} />
        <ProfileMenuRow title="Skin Profile" icon="body-outline" onPress={() => router.push('/skin-profile')} />
        <ProfileMenuRow title="Scan History" icon="time-outline" onPress={() => console.log('Scan history')} />
        <ProfileMenuRow
          title="Saved Recommendations"
          icon="bookmark-outline"
          isLast
          onPress={() => router.push('/recommendations/list')}
        />
      </ProfileMenuSection>

      <ProfileMenuSection title="Preferences">
        <ProfileMenuRow title="Routine Preferences" icon="calendar-outline" onPress={() => router.push('/(tabs)/routine')} />
        <ProfileMenuRow
          title="Notifications"
          subtitle="Reminders, alerts, and quiet hours"
          icon="notifications-outline"
          onPress={() => router.push(APP_ROUTES.settingsNotifications)}
        />
        <ProfileMenuRow
          title="Settings"
          icon="settings-outline"
          subtitle="Appearance, privacy, and app preferences"
          isLast
          onPress={() => router.push(APP_ROUTES.settings)}
        />
      </ProfileMenuSection>

      <ProfileMenuSection title="Support">
        <ProfileMenuRow title="Help & Support" icon="help-circle-outline" onPress={() => console.log('Help')} />
        <ProfileMenuRow title="Privacy Policy" icon="shield-outline" onPress={() => router.push(APP_ROUTES.settingsPrivacy)} />
        <ProfileMenuRow title="Terms of Use" icon="document-text-outline" onPress={() => router.push(APP_ROUTES.settingsAbout)} />
        <ProfileMenuRow title="About dermAI" icon="information-circle-outline" isLast onPress={() => router.push(APP_ROUTES.settingsAbout)} />
      </ProfileMenuSection>

      <AppButton
        label="Log out"
        variant="danger"
        onPress={handleLogout}
        style={{ marginTop: spacing.sm }}
      />
    </AppScreen>
  );
}

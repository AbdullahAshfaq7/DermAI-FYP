import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { streak } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** F1 Me: real numbers; account and preference entries. */
export default function Me() {
  const s = useApp();
  const name = s.session?.name ?? '';
  const visits = s.appointments.filter((a) => a.status !== 'cancelled').length;
  const unread = s.notifications.filter((n) => !n.read).length;
  const days = streak(s);
  const stats = [
    `${s.scans.length} scan${s.scans.length === 1 ? '' : 's'}`,
    days ? `${days}-day streak` : null,
    `${visits} visit${visits === 1 ? '' : 's'}`,
  ].filter(Boolean);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md }}>
        <Avatar name={name} size={64} tone={s.profile.tone ?? 2} />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{name}</Txt>
          <Txt variant="small" color="secondary">
            {stats.join(' · ')}
          </Txt>
        </View>
      </View>
      <Txt variant="heading">Account</Txt>
      <List>
        <Row icon="person" title="Personal information" chevron onPress={() => router.push('/personal')} />
        <Row icon="face" title="Skin profile" chevron onPress={() => router.push('/skin-profile')} />
        <Row icon="history" title="Scan history" chevron onPress={() => router.push('/history')} />
        <Row icon="insights" title="Progress" chevron onPress={() => router.push('/progress')} />
        <Row icon="bookmark" title="Saved recommendations" chevron onPress={() => router.push('/saved')} />
      </List>
      <Txt variant="heading">Preferences</Txt>
      <List>
        <Row icon="calendar-month" title="Routine preferences" chevron onPress={() => router.push('/routine-preferences')} />
        <Row icon="event" title="Appointments" chevron onPress={() => router.push('/appointments')} />
        <Row icon="notifications" title="Notifications" right={unread ? <StatusPill label={String(unread)} tone="act" /> : null} chevron onPress={() => router.push('/notifications')} />
        <Row icon="settings" title="Settings" chevron onPress={() => router.push('/settings')} />
      </List>
    </Screen>
  );
}

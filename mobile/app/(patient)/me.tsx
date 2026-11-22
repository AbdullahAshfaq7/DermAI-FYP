import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, IconButton, List, Row, Screen, Stat, StatusPill, Txt } from '@/components/ui/kit';
import { FITZ_ROMAN } from '@/data/seed';
import { shortDay } from '@/lib/format';
import { nextAppointment, streak } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** F1 Me: real numbers; each entry opens F2 to F8. */
export default function Me() {
  const { colors } = useTheme();
  const s = useApp();
  const name = s.session?.name ?? '';
  const unread = s.notifications.filter((n) => !n.read).length;
  const days = streak(s);
  const first = s.scans[s.scans.length - 1];
  const last = s.scans[0];
  const change = first && last && s.scans.length > 1 ? last.score - first.score : null;
  const appt = nextAppointment(s);
  const skin = [s.profile.feel ? `${s.profile.feel} skin` : null, s.profile.tone != null ? `type ${FITZ_ROMAN[s.profile.tone]}` : null].filter(Boolean).join(', ');

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md }}>
        <Avatar name={name} size={64} tone={s.profile.tone ?? 2} uri={s.session?.avatarUrl} />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{name}</Txt>
          <Txt variant="small" color="secondary">
            {skin || 'Skin profile not set'}
          </Txt>
        </View>
        <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={String(s.scans.length)} label={s.scans.length === 1 ? 'scan' : 'scans'} />
        <Stat value={String(days)} label="day streak" tone="butter" />
        <Stat value={change == null ? '–' : `${change >= 0 ? '+' : ''}${change}`} label={first ? 'score since first' : 'score change'} valueColor={change != null && change > 0 ? colors.good : undefined} />
      </View>
      <List>
        <Row icon="person" title="Personal information" chevron onPress={() => router.push('/personal')} />
        <Row icon="face" title="Skin profile" chevron onPress={() => router.push('/skin-profile')} />
        <Row icon="history" title="Scan history" chevron onPress={() => router.push('/history')} />
        <Row icon="insights" title="Progress" chevron onPress={() => router.push('/progress')} />
        <Row icon="bookmark" title="Saved" value={s.saved.length ? String(s.saved.length) : undefined} chevron onPress={() => router.push('/saved')} />
        <Row icon="tune" title="Routine preferences" chevron onPress={() => router.push('/routine-preferences')} />
        <Row icon="event" iconTone="clinician" title="Appointments" right={appt ? <StatusPill label={appt.service === 'message' ? 'Review' : shortDay(appt.start)} tone="clinician" /> : null} chevron onPress={() => router.push('/appointments')} />
      </List>
      <List>
        <Row icon="notifications" iconTone="muted" title="Notifications" right={unread ? <StatusPill label={String(unread)} tone="act" /> : null} chevron onPress={() => router.push('/notifications')} />
        <Row icon="admin-panel-settings" iconTone="muted" title="Privacy and data" chevron onPress={() => router.push('/privacy')} />
      </List>
    </Screen>
  );
}

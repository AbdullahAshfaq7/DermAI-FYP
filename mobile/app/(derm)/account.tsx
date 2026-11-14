import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, List, Row, Screen, Stat, StatusPill, Txt } from '@/components/ui/kit';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** H8 Me (dermatologist): profile, services, hours, payouts. */
export default function DermMe() {
  const { colors } = useTheme();
  const s = useApp();
  const name = s.session?.name ?? 'Doctor';
  const approved = s.derm.status === 'approved';
  const patients = new Set(s.derm.cases.map((c) => c.patient.name)).size;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md }}>
        <Avatar name={name} size={64} tone={3} clinician={!s.derm.photo} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{name}</Txt>
          {approved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="verified" size={16} color={colors.clinician} />
              <Txt variant="small" color="clinician">
                Verified{s.session?.demo ? ' 3 Nov 2026' : ''}
              </Txt>
            </View>
          ) : (
            <StatusPill label="Under review" tone="watch" />
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={s.session?.demo ? '38' : String(patients)} label="Patients" />
        <Stat value={approved && s.session?.demo ? '4.9' : '–'} label="Rating" />
        <Stat value={s.session?.demo ? '2 h' : '–'} label="Avg. reply" />
      </View>
      <List>
        <Row
          icon="badge"
          title="Public profile"
          subtitle="What patients see"
          chevron
          onPress={() =>
            s.session?.demo
              ? router.push({ pathname: '/doctors/[id]', params: { id: 'dr-sana', preview: '1' } })
              : Alert.alert('Public profile', approved ? 'Your profile is live.' : 'Your profile goes live once your PMDC registration is verified.')
          }
        />
        <Row icon="medical-services" title="Services and fees" chevron onPress={() => router.push({ pathname: '/derm-setup/services', params: { edit: '1' } })} />
        <Row icon="schedule" title="Availability" chevron onPress={() => router.push('/availability')} />
        <Row icon="payments" title="Earnings and payouts" chevron onPress={() => router.push('/earnings')} />
        <Row icon="settings" title="Settings" chevron onPress={() => router.push('/settings')} />
      </List>
    </Screen>
  );
}

import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Card, List, Row, Screen, Stat, StatusPill, Txt } from '@/components/ui/kit';
import { dayMonth } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** H8 Me (dermatologist): profile, services, hours, payouts. */
export default function DermMe() {
  const { colors } = useTheme();
  const s = useApp();
  const name = s.session?.name ?? 'Doctor';
  const approved = s.derm.status === 'approved';
  const stats = s.derm.stats;
  const now = new Date();
  // Fees booked per month for the last six months (this month last).
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return (s.derm.ledger ?? [])
      .filter((x) => {
        const t = new Date(x.start);
        return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
      })
      .reduce((n, x) => n + x.fee, 0);
  });
  const peak = Math.max(1, ...months);
  const change = months[4] ? Math.round(((months[5] - months[4]) / months[4]) * 100) : null;
  // Past tripling, a percentage reads oddly ("+967%"); say how many times last month instead.
  const changeLabel = change == null ? '' : change > 200 ? `${Math.round(months[5] / months[4])}× ${MONTHS[(now.getMonth() + 11) % 12]}` : `${change >= 0 ? '+' : ''}${change}%`;
  const verified = s.derm.verifiedAt ? new Date(s.derm.verifiedAt) : null;

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md }}>
        <Avatar name={name} size={64} tone={3} clinician={!s.derm.photoUrl} uri={s.derm.photoUrl} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{name}</Txt>
          {approved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="verified" size={16} color={colors.clinician} />
              <Txt variant="small" color="clinician">
                Verified{verified ? ` ${dayMonth(verified)} ${verified.getFullYear()}` : ''}
              </Txt>
            </View>
          ) : s.derm.status === 'rejected' ? (
            <StatusPill label="Needs changes" tone="act" />
          ) : (
            <StatusPill label="Under review" tone="watch" />
          )}
        </View>
      </View>
      <Card onPress={() => router.push('/earnings')} label="Earnings">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="small" color="secondary">
            {MONTHS[now.getMonth()]} so far
          </Txt>
          {change != null ? <StatusPill label={changeLabel} tone={change >= 0 ? 'good' : 'watch'} /> : null}
        </View>
        <Txt variant="number" style={{ fontSize: 28, lineHeight: 32, marginTop: 2 }}>
          Rs {months[5].toLocaleString('en-US')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 48, marginTop: space.sm }} accessibilityLabel="Earnings over the last six months">
          {months.map((m, i) => (
            <View key={i} style={{ flex: 1, height: `${Math.max(6, (m / peak) * 100)}%`, borderRadius: 6, backgroundColor: i === 5 ? colors.clinician : colors.clinicianWash }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Txt variant="caption" color="muted">
            {MONTHS[(now.getMonth() + 7) % 12]}
          </Txt>
          <Txt variant="caption" color="muted">
            {MONTHS[now.getMonth()]}
          </Txt>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={String(stats?.patients ?? 0)} label="Patients" />
        <Stat value={stats?.reviews ? String(stats.rating) : '–'} label={stats?.reviews ? `${stats.reviews} reviews` : 'Rating'} />
        <Stat value={stats?.replyHours ? `${stats.replyHours} h` : '–'} label="Avg. reply" />
      </View>
      <List>
        <Row
          icon="badge"
          title="Public profile"
          subtitle="What patients see"
          chevron
          onPress={() =>
            approved && s.derm.id
              ? router.push({ pathname: '/doctors/[id]', params: { id: s.derm.id, preview: '1' } })
              : Alert.alert('Public profile', 'Your profile goes live once your PMDC registration is verified.')
          }
        />
        <Row icon="verified-user" title="Registration and documents" subtitle={s.derm.pmdc ? `PMDC ${s.derm.pmdc}` : undefined} chevron onPress={() => router.push('/derm-setup/credentials')} />
        <Row icon="person" title="Personal information" chevron onPress={() => router.push('/personal')} />
        <Row icon="medical-services" title="Services and fees" chevron onPress={() => router.push({ pathname: '/derm-setup/services', params: { edit: '1' } })} />
        <Row icon="schedule" title="Availability" chevron onPress={() => router.push('/availability')} />
        <Row icon="account-balance-wallet" title="Payouts" subtitle="JazzCash or bank transfer, coming soon" chevron onPress={() => router.push('/earnings')} />
        <Row icon="settings" iconTone="muted" title="Settings" chevron onPress={() => router.push('/settings')} />
      </List>
    </Screen>
  );
}

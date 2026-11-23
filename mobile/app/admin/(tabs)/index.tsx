import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loader, Section, Tile } from '@/components/admin';
import { Avatar, Banner, Card, List, Row, Txt } from '@/components/ui/kit';
import { ACTION_LABEL, adminApi, dateTime, ROLE_LABEL, useAdminQuery } from '@/lib/admin';
import { pkr } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { dockClearance, space } from '@/theme/tokens';

/** Admin home: the platform at a glance, with what needs attention first. */
export default function Overview() {
  const s = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: o, error, loading, reload } = useAdminQuery(adminApi.overview);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading && !!o} onRefresh={() => void reload()} />}
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: dockClearance + insets.bottom, gap: space.md + 2 }}>
        <View style={{ marginTop: space.sm }}>
          <Txt variant="caption" color="secondary">
            Signed in as {s.session?.name}
          </Txt>
          <Txt variant="display">Overview</Txt>
        </View>
        <Loader loading={loading} error={error} onRetry={() => void reload()}>
          {o ? (
            <>
              {o.doctors.pending ? (
                <Banner icon="verified-user" tone="butter" text={`${o.doctors.pending} doctor${o.doctors.pending === 1 ? '' : 's'} waiting for PMDC review`} action="Review" onAction={() => router.push('/admin/doctors')} />
              ) : null}
              {o.cases.urgentOpen ? (
                <Banner icon="priority-high" tone="act" text={`${o.cases.urgentOpen} urgent case${o.cases.urgentOpen === 1 ? '' : 's'} still open`} action="View" onAction={() => router.push({ pathname: '/admin/cases', params: { urgency: 'urgent' } })} />
              ) : null}

              <Txt variant="heading">People</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                <Tile icon="people" value={o.users.total} label="All accounts" onPress={() => router.push('/admin/users')} />
                <Tile icon="face" value={o.users.patients} label="Patients" onPress={() => router.push({ pathname: '/admin/users', params: { role: 'patient' } })} />
                <Tile icon="stethoscope" value={o.users.dermatologists} label="Dermatologists" onPress={() => router.push({ pathname: '/admin/users', params: { role: 'dermatologist' } })} />
                <Tile icon="person-add" value={o.users.newThisWeek} label="New this week" tone="good" />
                <Tile icon="block" value={o.users.suspended} label="Suspended" tone={o.users.suspended ? 'act' : 'muted'} onPress={() => router.push({ pathname: '/admin/users', params: { status: 'suspended' } })} />
                <Tile icon="admin-panel-settings" value={o.users.admins} label="Admins" onPress={() => router.push({ pathname: '/admin/users', params: { role: 'admin' } })} />
              </View>

              <Txt variant="heading">Care</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                <Tile icon="today" value={o.appointments.today} label="Visits today" onPress={() => router.push('/admin/bookings')} />
                <Tile icon="event" value={o.appointments.upcoming} label="Upcoming bookings" onPress={() => router.push('/admin/bookings')} />
                <Tile icon="inbox" value={o.cases.waiting} label="Cases waiting" tone={o.cases.waiting ? 'watch' : 'muted'} onPress={() => router.push('/admin/cases')} />
                <Tile icon="camera-alt" value={o.scans.total} label={`Scans · ${o.scans.thisWeek} this week`} onPress={() => router.push('/admin/scans')} />
              </View>

              <Section title="Doctors">
                <Row title="Verified" value={String(o.doctors.approved)} />
                <Row title="Waiting for review" value={String(o.doctors.pending)} />
                <Row title="Sent back for changes" value={String(o.doctors.rejected)} />
                <Row title="Still onboarding" value={String(o.doctors.draft)} />
              </Section>

              <Section title="Money">
                <Row title="Completed visits" subtitle="Fees for visits that happened" value={pkr(o.revenue.gross)} />
                <Row title="Marked paid" value={pkr(o.revenue.paid)} />
                <Row title={`DermAI commission (${o.revenue.commissionPct}%)`} value={pkr(o.revenue.commission)} />
                <Row title="Average scan score" value={o.scans.averageScore === null ? '—' : String(o.scans.averageScore)} />
              </Section>

              <Txt variant="heading">Newest accounts</Txt>
              <List>
                {o.recentUsers.map((u) => (
                  <Row
                    key={u.id}
                    leading={<Avatar name={u.name} size={36} clinician={u.role === 'dermatologist'} />}
                    title={u.name}
                    subtitle={`${ROLE_LABEL[u.role]} · ${dateTime(u.createdAt)}`}
                    chevron
                    onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: u.id } })}
                  />
                ))}
              </List>

              <Txt variant="heading">Recent admin activity</Txt>
              {o.activity.length ? (
                <List>
                  {o.activity.map((a) => (
                    <Row key={a.id} icon="history" iconTone="muted" title={ACTION_LABEL[a.action] ?? a.action} subtitle={`${a.adminName} · ${dateTime(a.at)}${a.detail ? ` · ${a.detail}` : ''}`} />
                  ))}
                </List>
              ) : (
                <Card tone="muted">
                  <Txt variant="small" color="secondary">
                    No admin changes yet. Every change you make is recorded here and in the audit log.
                  </Txt>
                </Card>
              )}
            </>
          ) : null}
        </Loader>
      </ScrollView>
    </View>
  );
}

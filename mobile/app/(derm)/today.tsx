import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CaseRow, URGENCY_RANK } from '@/components/derm';
import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, EmptyState, IconButton, List, Screen, Stat, StatusPill, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { daysBetween, drShort, greeting, longWeekday, time } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

function inWords(iso: string, now: Date): string {
  const mins = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (mins <= 0) return 'Now';
  if (mins < 60) return `Next, in ${mins} min`;
  if (daysBetween(now, iso) === 0) return `Next, at ${time(iso)}`;
  return `Next, ${longWeekday(iso).split(',')[0]} ${time(iso)}`;
}

/** H1 Today: what needs attention, in the order to handle it. */
export default function Today() {
  const { colors } = useTheme();
  const s = useApp();
  const now = new Date();
  const waiting = s.derm.cases.filter((c) => c.status === 'waiting');
  const urgent = waiting.filter((c) => c.urgency === 'urgent');
  const todays = s.derm.visits.filter((v) => v.kind === 'visit' && v.status !== 'cancelled' && daysBetween(v.start, now) === 0);
  const unreadAlerts = s.notifications.some((n) => !n.read);
  const next = s.derm.visits
    .filter((v) => v.kind === 'visit' && v.status !== 'done' && new Date(v.start).getTime() > now.getTime() - 20 * 60000)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const nextCase = s.derm.cases.find((c) => c.id === next?.caseId);
  const firstLook = [...waiting].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]).slice(0, 3);
  const pending = s.derm.status === 'pending' || s.derm.status === 'draft';
  const rejected = s.derm.status === 'rejected';
  const name = s.session?.name ?? 'Doctor';

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm, gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted">
            {longWeekday(now)}
          </Txt>
          <Txt variant="title">
            {greeting(now)}, {drShort(name)}
          </Txt>
        </View>
        <IconButton icon="notifications-none" label="Notifications" badge={unreadAlerts} onPress={() => router.push('/notifications')} />
        <Pressable onPress={() => router.navigate('/account')} accessibilityRole="button" accessibilityLabel="Me">
          <Avatar name={name} size={40} tone={4} uri={s.derm.photoUrl} />
        </Pressable>
      </View>

      {pending ? (
        <Card tone="clinician" style={{ flexDirection: 'row', gap: space.md }}>
          <Icon name="hourglass-top" size={22} color={colors.clinicianDeep} />
          <Txt variant="small" color="clinician" style={{ flex: 1 }}>
            Your PMDC registration is being checked (usually 1 to 2 working days). Patients can book you once you&apos;re approved.
          </Txt>
        </Card>
      ) : null}
      {rejected ? (
        <Card tone="clinician" onPress={() => router.push('/derm-setup/credentials')}>
          <Txt variant="smallStrong" color="clinician">
            We couldn&apos;t verify your registration
          </Txt>
          <Txt variant="small" color="clinician">
            {s.derm.reviewNote || 'Check your PMDC number and documents.'} Tap to update and resubmit.
          </Txt>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={String(todays.length)} label="visits today" />
        <Stat value={String(waiting.length)} label="cases waiting" />
        <Stat value={String(urgent.length)} label="urgent" tone={urgent.length ? 'act' : undefined} />
      </View>

      {next ? (
        <Card tone="clinicianFill">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="caption" color="onFill" style={{ opacity: 0.85 }}>
              {inWords(next.start, now)}
            </Txt>
            {next.service ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Icon name={SERVICE_META[next.service].icon} size={13} color="#FFFFFF" />
                <Txt variant="caption" color="onFill">
                  {SERVICE_META[next.service].short}
                </Txt>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
            <Avatar name={next.patientName ?? 'Patient'} size={30} tone={nextCase?.patient.tone ?? 3} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" color="onFill">
                {nextCase ? `${nextCase.patient.name}${nextCase.patient.age ? `, ${nextCase.patient.age}` : ''}` : next.patientName}
              </Txt>
              <Txt variant="caption" color="onFill" style={{ opacity: 0.85 }}>
                {nextCase?.complaint ?? next.label}
              </Txt>
            </View>
          </View>
          {next.caseId ? (
            <Button label="Open case" variant="light" compact style={{ marginTop: space.md, alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/case/[id]', params: { id: next.caseId! } })} />
          ) : null}
        </Card>
      ) : null}

      <Txt variant="heading">Needs you first</Txt>
      {firstLook.length ? (
        <List>
          {firstLook.map((c) => (
            <CaseRow key={c.id} c={c} detail="summary" avatar />
          ))}
        </List>
      ) : (
        <EmptyState icon="task-alt" title="Nothing waiting" body="New cases appear here as patients send them." />
      )}
      {waiting.length > firstLook.length ? (
        <Txt variant="smallStrong" color="brand" onPress={() => router.navigate('/cases')}>
          {waiting.length - firstLook.length} more waiting
        </Txt>
      ) : null}
      {urgent.length ? <StatusPill label={`${urgent.length} urgent: answer these first`} tone="act" icon="priority-high" /> : null}
    </Screen>
  );
}

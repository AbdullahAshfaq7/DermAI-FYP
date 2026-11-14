import { router } from 'expo-router';
import { View } from 'react-native';

import { CaseRow, shortPatient, URGENCY_RANK } from '@/components/derm';
import { Icon } from '@/components/ui/Icon';
import { Button, Card, EmptyState, IconButton, List, Screen, Stat, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { daysBetween, drShort, greeting, longWeekday, time } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** H1 Today: what needs attention, in order. */
export default function Today() {
  const { colors } = useTheme();
  const s = useApp();
  const now = new Date();
  const waiting = s.derm.cases.filter((c) => c.status === 'waiting');
  const todays = s.derm.visits.filter((v) => v.kind === 'visit' && daysBetween(v.start, now) === 0);
  const unread = s.threads.filter((t) => t.unreadForDoctor > 0).length;
  const next = s.derm.visits
    .filter((v) => v.kind === 'visit' && new Date(v.start).getTime() > now.getTime() - 20 * 60000)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const nextCase = s.derm.cases.find((c) => c.id === next?.caseId);
  const firstLook = [...waiting].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]).filter((c) => c.urgency === 'urgent' || c.urgency === 'high');
  const pending = s.derm.status !== 'approved';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm }}>
        <View style={{ flex: 1 }}>
          <Txt variant="small" color="secondary">
            {longWeekday(now)}
          </Txt>
          <Txt variant="title">
            Good {greeting(now).toLowerCase()}, {drShort(s.session?.name ?? 'Doctor')}
          </Txt>
        </View>
        <IconButton icon="notifications-none" label="Messages" badge={unread > 0} onPress={() => router.navigate('/messages')} />
      </View>

      {pending ? (
        <View style={{ flexDirection: 'row', gap: space.md, backgroundColor: colors.clinicianWash, borderRadius: 16, padding: space.lg }}>
          <Icon name="hourglass-top" size={22} color={colors.clinician} />
          <Txt variant="small" color="clinician" style={{ flex: 1 }}>
            Your PMDC registration is being checked (usually 2 working days). Patients can book you once you&apos;re approved.
          </Txt>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={String(waiting.length)} label="Cases waiting" />
        <Stat value={String(todays.length)} label="Visits today" />
        <Stat value={String(unread)} label="Unread" />
      </View>

      {next ? (
        <Card tone="clinician" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodyStrong" color="clinician">
              Next: {next.patientName}, {time(next.start)}
              {daysBetween(next.start, now) !== 0 ? ` ${longWeekday(next.start).split(',')[0]}` : ''}
            </Txt>
            <Txt variant="small" color="clinician">
              {next.service ? SERVICE_META[next.service].short : ''}
              {nextCase ? ` · ${nextCase.complaint.toLowerCase()} · ${nextCase.photos.length + 1} scans` : ` · ${next.label}`}
            </Txt>
          </View>
          {next.caseId ? <Button label="Open" variant="clinician" compact onPress={() => router.push({ pathname: '/case/[id]', params: { id: next.caseId! } })} /> : null}
        </Card>
      ) : null}

      <Txt variant="heading">Needs a look first</Txt>
      {firstLook.length ? (
        <List>
          {firstLook.map((c) => (
            <CaseRow key={c.id} c={c} detail="summary" />
          ))}
        </List>
      ) : (
        <EmptyState icon="task-alt" title="Nothing urgent" body={waiting.length ? `${waiting.length} routine case${waiting.length === 1 ? '' : 's'} in your inbox.` : 'New cases appear here as patients send them.'} action={waiting.length ? 'Open cases' : undefined} onAction={() => router.navigate('/cases')} />
      )}
      {firstLook.length && waiting.length > firstLook.length ? (
        <Txt variant="smallStrong" color="clinician" onPress={() => router.navigate('/cases')}>
          {waiting.length - firstLook.length} more waiting · {shortPatient(waiting.find((c) => !firstLook.includes(c))!.patient.name)} and others
        </Txt>
      ) : null}
    </Screen>
  );
}

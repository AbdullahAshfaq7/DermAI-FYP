import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Button, Card, IconButton, IconTile, List, Row, Screen, Txt } from '@/components/ui/kit';
import { FaceMap } from '@/components/visual';
import { CONCERNS, DOCTORS } from '@/data/seed';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, firstName, greeting, longWeekday, time, weekdayDayMonth } from '@/lib/format';
import { nextAppointment, previousScan, rescanIn, routineProgress, trendWord } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const SERVICE_LABEL = { video: 'Video visit', clinic: 'Clinic visit', message: 'Case review' } as const;

/** D1 Home: one status card, today's task, what's coming. */
export default function Home() {
  const s = useApp();
  const now = new Date();
  const scan = s.scans[0];
  const prev = scan ? previousScan(s, scan) : undefined;
  const evening = now.getHours() >= 15;
  const period = evening ? 'pm' : 'am';
  const prog = routineProgress(s, period);
  const appt = nextAppointment(s);
  const doctor = appt ? DOCTORS.find((d) => d.id === appt.doctorId) : undefined;
  const rescan = rescanIn(s);
  const unread = s.notifications.some((n) => !n.read);

  let statusLine = 'Your first scan';
  if (scan && prev) {
    const top = rankedConcerns(scan)[0];
    const word = trendWord([prev.concerns[top].pct, scan.concerns[top].pct]);
    const d = scan.score - prev.score;
    statusLine = `${CONCERNS[top].label} ${word}, ${d >= 0 ? 'up' : 'down'} ${Math.abs(d)}`;
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm }}>
        <View style={{ flex: 1 }}>
          <Txt variant="small" color="secondary">
            {longWeekday(now)}
          </Txt>
          <Txt variant="title">
            {greeting(now)}, {firstName(s.session?.name ?? '')}
          </Txt>
        </View>
        <IconButton icon="notifications-none" label={unread ? 'Notifications, new' : 'Notifications'} badge={unread} onPress={() => router.push('/notifications')} />
      </View>

      {scan ? (
        <Card onPress={() => router.push({ pathname: '/scan/results/[id]', params: { id: scan.id } })} label={`Latest scan, score ${scan.score}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <FaceMap zones={scan.zones} width={84} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="small" color="secondary">
                Latest scan · {dayMonth(scan.date)}
              </Txt>
              <Txt variant="display" style={{ fontSize: 34, lineHeight: 38 }}>
                {scan.score}
              </Txt>
              <Txt variant="small" color="secondary">
                {statusLine}
              </Txt>
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <Txt variant="heading">No scans yet</Txt>
          <Txt variant="body" color="secondary" style={{ marginTop: 4, marginBottom: space.md }}>
            Your first one takes about a minute.
          </Txt>
          <Button label="Scan my skin" variant="brand" icon="center-focus-weak" onPress={() => router.push('/scan')} />
        </Card>
      )}

      {prog.total ? (
        <Card tone="brandFill" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" color="onFill">
              {evening ? 'Evening' : 'Morning'} routine
            </Txt>
            <Txt variant="small" color="onFill" style={{ opacity: 0.85 }}>
              {prog.done === prog.total ? 'All done for today' : `${prog.done} of ${prog.total} steps done`}
            </Txt>
          </View>
          <Button label={prog.done === prog.total ? 'View' : prog.done ? 'Continue' : 'Start'} variant="light" compact onPress={() => router.navigate('/routine')} />
        </Card>
      ) : null}

      <Txt variant="heading">Next up</Txt>
      <List>
        {appt && doctor ? (
          <Row
            leading={<IconTile icon="event" />}
            title={doctor.name}
            subtitle={appt.service === 'message' ? 'Case review by message, reply within 24 hrs' : `${SERVICE_LABEL[appt.service]}, ${weekdayDayMonth(appt.start)}, ${time(appt.start)}`}
            chevron
            onPress={() => router.push({ pathname: '/booked/[id]', params: { id: appt.id } })}
          />
        ) : (
          <Row leading={<IconTile icon="stethoscope" />} title="See a dermatologist" subtitle="Verified doctors, video or clinic" chevron onPress={() => router.push('/doctors')} />
        )}
        <Row
          leading={<IconTile icon="photo-camera" />}
          title={rescan == null ? 'Take your first scan' : rescan <= 0 ? 'Time to rescan' : `Rescan in ${rescan} day${rescan === 1 ? '' : 's'}`}
          subtitle="Same light, same time of day"
          chevron
          onPress={() => router.push('/scan')}
        />
        {s.scans.length > 1 ? (
          <Row leading={<IconTile icon="insights" />} title="Your progress" subtitle={`${s.scans.length} scans since ${dayMonth(s.scans[s.scans.length - 1].date)}`} chevron onPress={() => router.push('/progress')} />
        ) : null}
      </List>
      {s.threads.some((t) => t.unreadForPatient) ? (
        <Card tone="brand" onPress={() => router.push({ pathname: '/thread/[id]', params: { id: s.threads.find((t) => t.unreadForPatient)!.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={DOCTORS.find((d) => d.id === s.threads.find((t) => t.unreadForPatient)!.doctorId)?.name ?? 'Doctor'} size={36} tone={3} />
            <Txt variant="smallStrong" color="brandDeep" style={{ flex: 1 }}>
              New message from your dermatologist
            </Txt>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

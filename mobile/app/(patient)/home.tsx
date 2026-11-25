import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, Chip, IconButton, IconTile, ProgressBar, Screen, StatusPill, Tick, Txt } from '@/components/ui/kit';
import { FaceMap } from '@/components/visual';
import { greeting, longWeekday, time, weekdayDayMonth, firstName, daysBetween } from '@/lib/format';
import { periodNow } from '@/lib/routine';
import { doctorById, nextAppointment, previousScan, rescanIn, routineProgress, streak, summaryLine, todayKey } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const SERVICE_LABEL = { video: 'Video visit', clinic: 'Clinic visit', message: 'Case review' } as const;

/** D1 Home: score, today's task and what's coming, in that order. */
export default function Home() {
  const { colors } = useTheme();
  const s = useApp();
  const { toggleStep } = useActions();
  const now = new Date();
  const scan = s.scans[0];
  const prev = scan ? previousScan(s, scan) : undefined;
  const period = periodNow(now);
  const prog = routineProgress(s, period);
  const done = s.routineLog[todayKey()] ?? [];
  const days = streak(s);
  const appt = nextAppointment(s);
  const doctor = appt ? doctorById(s, appt.doctorId) : undefined;
  const unreadThread = s.threads.find((t) => t.unreadForPatient > 0);
  const unreadDoctor = doctorById(s, unreadThread?.doctorId);
  const due = s.settings.rescanDue ? daysBetween(now, `${s.settings.rescanDue}T09:00:00`) : null;
  const rescan = due ?? rescanIn(s);
  const unread = s.notifications.some((n) => !n.read);
  const delta = scan && prev ? scan.score - prev.score : null;
  const nextStep = prog.steps.find((x) => !done.includes(x.id));

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm, gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted">
            {longWeekday(now)}
          </Txt>
          <Txt variant="title">
            Good {greeting(now).toLowerCase()}, {firstName(s.session?.name ?? '')}
          </Txt>
        </View>
        <IconButton icon="notifications-none" label={unread ? 'Notifications, new' : 'Notifications'} badge={unread} onPress={() => router.push('/notifications')} />
        <Pressable onPress={() => router.navigate('/me')} accessibilityRole="button" accessibilityLabel="Me">
          <Avatar name={s.session?.name ?? 'You'} size={40} tone={s.profile.tone ?? 2} uri={s.session?.avatarUrl} />
        </Pressable>
      </View>

      {scan ? (
        <Card tone="night" padded={false} onPress={() => router.push({ pathname: '/scan/results/[id]', params: { id: scan.id } })} label={`Latest scan, score ${scan.score}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingRight: space.lg }}>
            <FaceMap zones={scan.zones} width={120} height={136} density={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption" style={{ color: '#A6B8D4' }}>
                Skin score
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Txt variant="score" style={{ color: '#EAF2FF', fontSize: 42, lineHeight: 46 }}>
                  {scan.score}
                </Txt>
                {delta != null ? <StatusPill icon={delta >= 0 ? 'trending-up' : 'trending-down'} label={`${delta >= 0 ? '+' : ''}${delta}`} tone={delta >= 0 ? 'good' : 'act'} /> : null}
              </View>
              <Txt variant="caption" style={{ color: '#A6B8D4' }} numberOfLines={2}>
                {summaryLine(scan).split('.')[0]}
              </Txt>
            </View>
          </View>
        </Card>
      ) : (
        <Card tone="night">
          <Txt variant="heading" style={{ color: '#EAF2FF' }}>
            No scans yet
          </Txt>
          <Txt variant="body" style={{ color: '#A6B8D4', marginTop: 4, marginBottom: space.md }}>
            Your first one takes about a minute.
          </Txt>
          <Button label="Scan my skin" icon="center-focus-strong" onPress={() => router.push('/scan')} />
        </Card>
      )}

      {prog.total ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.navigate('/routine')} accessibilityRole="button" style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{period === 'pm' ? "Tonight's routine" : "This morning's routine"}</Txt>
              <Txt variant="caption" color="muted">
                {prog.done === prog.total ? 'All done for today' : `${prog.done} of ${prog.total} done`}
              </Txt>
            </Pressable>
            {days > 0 ? <Chip tone="butter" icon="local-fire-department" label={`${days} day${days === 1 ? '' : 's'}`} /> : null}
          </View>
          <View style={{ marginTop: space.md }}>
            <ProgressBar value={(prog.done / prog.total) * 100} color={colors.brand} />
          </View>
          <View style={{ marginTop: space.sm }}>
            {prog.steps.slice(0, 3).map((st) => {
              const isDone = done.includes(st.id);
              return (
                <View key={st.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 }}>
                  <Tick
                    on={isDone}
                    size={24}
                    label={st.title}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      attempt(toggleStep(st.id));
                    }}
                  />
                  <Txt variant={isDone ? 'body' : 'bodyStrong'} color={isDone ? 'muted' : 'primary'} style={[{ flex: 1 }, isDone && { textDecorationLine: 'line-through' }]}>
                    {st.title}
                  </Txt>
                  {nextStep?.id === st.id ? (
                    <Txt variant="caption" color="muted">
                      Next
                    </Txt>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}

      {appt && doctor ? (
        <Card tone="clinician" onPress={() => router.push({ pathname: '/booked/[id]', params: { id: appt.id } })} label={`${doctor.name}, ${SERVICE_LABEL[appt.service]}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={doctor.name} size={34} tone={doctor.tone} uri={doctor.photoUrl} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{doctor.name}</Txt>
              <Txt variant="small" color="secondary">
                {appt.service === 'message' ? 'Case review, reply within 24 hrs' : `${SERVICE_LABEL[appt.service]}, ${weekdayDayMonth(appt.start)}, ${time(appt.start)}`}
              </Txt>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ) : null}

      {unreadThread ? (
        <Card tone="brand" onPress={() => router.push({ pathname: '/thread/[id]', params: { id: unreadThread.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={unreadDoctor?.name ?? 'Doctor'} size={34} tone={unreadDoctor?.tone ?? 3} uri={unreadDoctor?.photoUrl} />
            <Txt variant="smallStrong" color="brandDeep" style={{ flex: 1 }}>
              New message from {unreadDoctor?.name ?? 'your dermatologist'}
            </Txt>
            <Icon name="chevron-right" size={22} color={colors.brandDeep} />
          </View>
        </Card>
      ) : null}

      <Card onPress={() => router.push('/scan')} label="Next scan">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile icon="event-repeat" size={38} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">
              {rescan == null ? 'Take your first scan' : rescan <= 0 ? 'Time for a new scan' : `Next scan in ${rescan} day${rescan === 1 ? '' : 's'}`}
            </Txt>
            <Txt variant="caption" color="muted">
              {s.settings.rescanDue ? 'Your dermatologist asked for this one' : 'Same light, same time works best'}
            </Txt>
          </View>
        </View>
      </Card>

      {s.scans.length > 1 ? (
        <Card onPress={() => router.push('/progress')} label="Your progress">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <IconTile icon="insights" size={38} tone="peach" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Your progress</Txt>
              <Txt variant="caption" color="muted">
                {s.scans.length} scans so far
              </Txt>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ) : appt ? null : (
        <Card onPress={() => router.push('/doctors')} label="See a dermatologist">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <IconTile icon="stethoscope" size={38} tone="clinician" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">See a dermatologist</Txt>
              <Txt variant="caption" color="muted">
                PMDC-verified, video or clinic
              </Txt>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

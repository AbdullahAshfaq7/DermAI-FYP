import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, Chip, IconButton, ProgressBar, Screen, SectionTitle, Tick, Txt, shadow } from '@/components/ui/kit';
import { ConcernTile, ScoreRing } from '@/components/skin';
import { LogoMark } from '@/components/visual';
import { CONCERN_ORDER } from '@/data/seed';
import { greeting, longWeekday, time, weekdayDayMonth, firstName, daysBetween } from '@/lib/format';
import { periodNow } from '@/lib/routine';
import { doctorById, nextAppointment, previousScan, rescanIn, routineProgress, streak, summaryLine, todayKey } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const SERVICE_LABEL = { video: 'Video visit', clinic: 'Clinic visit', message: 'Case review' } as const;

/** D1 Home: skin overview (score and six concerns), today's routine, then what's coming. */
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
  const name = firstName(s.session?.name ?? '');
  const [tip, setTip] = useState(false);
  const openReport = (id: string) => router.push({ pathname: '/scan/results/[id]', params: { id } });

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm, gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted">
            {longWeekday(now)}
          </Txt>
          <Txt variant="title">
            Good {greeting(now).toLowerCase()}
            {name ? `, ${name}` : ''}
          </Txt>
        </View>
        <IconButton icon="notifications-none" label={unread ? 'Notifications, new' : 'Notifications'} badge={unread} onPress={() => router.push('/notifications')} />
        <Pressable onPress={() => router.navigate('/me')} accessibilityRole="button" accessibilityLabel="Me">
          <Avatar name={s.session?.name ?? 'You'} size={40} tone={s.profile.tone ?? 2} uri={s.session?.avatarUrl} />
        </Pressable>
      </View>

      {scan ? (
        <Pressable
          onPress={() => openReport(scan.id)}
          accessibilityRole="button"
          accessibilityLabel={`Latest scan, score ${scan.score}. View full report`}
          style={({ pressed }) => [{ borderRadius: radius.card, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }, shadow(colors, true)]}>
          <LinearGradient colors={[colors.brand, colors.brandAlt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.lg + 2 }}>
            <View style={{ flex: 1, gap: space.xs }}>
              <Txt variant="heading" style={{ color: '#FFFFFF' }}>
                Your skin overview
              </Txt>
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Txt variant="caption" style={{ color: '#FFFFFF' }}>
                  Latest scan · {weekdayDayMonth(scan.date)}
                </Txt>
              </View>
              <Txt variant="small" numberOfLines={2} style={{ color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                {summaryLine(scan).split('.')[0]}.
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Txt variant="smallStrong" style={{ color: '#FFFFFF' }}>
                  View full report
                </Txt>
                <Icon name="chevron-right" size={18} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ alignItems: 'center', gap: space.xs }}>
              <ScoreRing score={scan.score} size={96} onDark />
              {delta != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Icon name={delta >= 0 ? 'trending-up' : 'trending-down'} size={14} color="#FFFFFF" />
                  <Txt variant="caption" style={{ color: '#FFFFFF' }}>
                    {`${delta >= 0 ? '+' : ''}${delta} since last`}
                  </Txt>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={[{ borderRadius: radius.card, overflow: 'hidden' }, shadow(colors, true)]}>
          <LinearGradient colors={[colors.brand, colors.brandAlt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.lg + 2, gap: space.sm }}>
            <View style={{ position: 'absolute', right: -18, top: -10, opacity: 0.22 }}>
              <LogoMark size={150} />
            </View>
            <Txt variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
              STEP 1 OF YOUR SKIN JOURNEY
            </Txt>
            <Txt variant="title" style={{ color: '#FFFFFF' }}>
              Take your first{'\n'}skin scan
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
              {tip ? (
                <View
                  accessibilityLiveRegion="polite"
                  style={[{ position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: space.sm, backgroundColor: colors.surface, borderRadius: radius.control, padding: space.md }, shadow(colors, true)]}>
                  <Txt variant="small">30 seconds with your front camera. We read acne, redness, pores, dark spots and more.</Txt>
                  <View style={{ position: 'absolute', bottom: -6, left: 152, width: 12, height: 12, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] }} />
                </View>
              ) : null}
              <Button label="Scan my skin" icon="center-focus-strong" variant="light" compact onPress={() => router.push('/scan')} />
              <Pressable
                onPress={() => setTip((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="How the scan works"
                accessibilityState={{ expanded: tip }}
                hitSlop={8}
                style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                <Icon name={tip ? 'close' : 'info-outline'} size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        {scan ? null : <SectionTitle title="Your skin overview" />}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {CONCERN_ORDER.map((k) => (
            <ConcernTile key={k} k={k} reading={scan?.concerns[k]} onPress={scan ? () => router.push({ pathname: '/scan/concern/[key]', params: { key: k, scan: scan.id } }) : () => router.push('/scan')} />
          ))}
        </View>
        {scan ? null : (
          <Txt variant="caption" color="muted" align="center">
            Your first scan fills these in.
          </Txt>
        )}
      </View>

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

      {scan ? (
        <Pressable onPress={() => router.push('/scan')} accessibilityRole="button" accessibilityLabel="Scan my skin" style={({ pressed }) => [{ borderRadius: radius.card, overflow: 'hidden', opacity: pressed ? 0.9 : 1 }, shadow(colors)]}>
          <LinearGradient colors={[colors.brand, colors.brandAlt]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="center-focus-strong" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" style={{ color: '#FFFFFF' }}>
                {rescan == null || rescan <= 0 ? 'Time for a new scan' : `Next scan in ${rescan} day${rescan === 1 ? '' : 's'}`}
              </Txt>
              <Txt variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {s.settings.rescanDue ? 'Your dermatologist asked for this one' : 'Same light, same time works best'}
              </Txt>
            </View>
            <Icon name="chevron-right" size={22} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      ) : null}
    </Screen>
  );
}

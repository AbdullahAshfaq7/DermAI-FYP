import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Button, Screen, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { daysBetween, shortDay, time, todayKey, weekdayDayMonth } from '@/lib/format';
import { nextDays } from '@/lib/slots';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const HOUR = 52;

function clockToMinutes(s: string): number {
  const m = /(\d+):(\d+)\s*(am|pm)/i.exec(s);
  if (!m) return 0;
  return ((Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(m[2]);
}
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`;

/** H5 Schedule: the day as a timeline. Tap a visit to open its case, an empty hour to block it. */
export default function Schedule() {
  const { colors } = useTheme();
  const s = useApp();
  const { addBlock, removeBlock, cancelAppointment } = useActions();
  const [now] = useState(() => Date.now());
  const days = useMemo(() => nextDays(14, new Date(now)), [now]);
  const [day, setDay] = useState(0);
  const sel = days[day];
  const off = s.derm.availability.timeOff;
  const onTimeOff = !!off && todayKey(sel) >= off.from && todayKey(sel) <= off.to;
  const rule = onTimeOff ? undefined : s.derm.availability.days.find((d) => d.day === shortDay(sel));
  const items = s.derm.visits
    .filter((v) => daysBetween(v.start, sel) === 0 && v.status !== 'cancelled')
    .map((v) => ({ ...v, mins: new Date(v.start).getHours() * 60 + new Date(v.start).getMinutes() }));
  const openFrom = rule?.open ? clockToMinutes(rule.from) : 9 * 60;
  const openTo = rule?.open ? clockToMinutes(rule.to) : 17 * 60;
  const first = Math.floor(Math.min(openFrom, ...items.map((v) => v.mins)) / 60);
  const last = Math.ceil(Math.max(openTo, ...items.map((v) => v.mins + Math.max(30, v.minutes))) / 60);
  const hours = Array.from({ length: Math.max(1, last - first) }, (_, i) => first + i);
  const nextVisit = items.filter((v) => v.kind === 'visit' && new Date(v.start).getTime() > now).sort((a, b) => a.mins - b.mins)[0];

  const tapHour = (h: number) => {
    const t = new Date(sel);
    t.setHours(h, 0, 0, 0);
    if (t.getTime() < now) return;
    if (items.some((v) => v.mins < (h + 1) * 60 && v.mins + Math.max(20, v.minutes) > h * 60)) return;
    Alert.alert(`Block ${hourLabel(h)}?`, `Patients won't be able to book ${weekdayDayMonth(t)} from ${time(t)} for an hour.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block 1 hour', onPress: () => attempt(addBlock({ start: t.toISOString(), minutes: 60, label: 'Blocked' }), "Couldn't block the time") },
    ]);
  };

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
        <Txt variant="display">Schedule</Txt>
        <Button label="Edit hours" variant="soft" compact onPress={() => router.push('/availability')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {days.map((x, i) => {
          const active = i === day;
          return (
            <Pressable
              key={x.toISOString()}
              onPress={() => setDay(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{ width: 52, paddingVertical: space.sm, alignItems: 'center', borderRadius: 16, backgroundColor: active ? colors.brand : colors.surface }}>
              <Txt variant="caption" style={{ color: active ? colors.onFill : colors.textMuted }}>
                {shortDay(x)}
              </Txt>
              <Txt variant="heading" style={{ color: active ? colors.onFill : colors.textPrimary }}>
                {x.getDate()}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      {onTimeOff || !rule?.open ? (
        <Txt variant="small" color="secondary">
          {onTimeOff ? "You're on time off. Patients can't book you this day." : `You're closed on ${shortDay(sel)}s. Change this in your hours.`}
        </Txt>
      ) : null}
      <View style={{ position: 'relative', height: hours.length * HOUR + 8 }}>
        {hours.map((h, i) => {
          const inHours = rule?.open && h * 60 >= openFrom && h * 60 < openTo;
          return (
            <Pressable
              key={h}
              onPress={() => (inHours ? tapHour(h) : undefined)}
              accessibilityRole={inHours ? 'button' : undefined}
              accessibilityLabel={inHours ? `${hourLabel(h)}, open. Tap to block.` : hourLabel(h)}
              style={{ position: 'absolute', top: i * HOUR, left: 0, right: 0, height: HOUR, flexDirection: 'row' }}>
              <Txt variant="caption" color="muted" style={{ width: 46 }}>
                {hourLabel(h)}
              </Txt>
              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: inHours ? 'transparent' : colors.surfaceMuted, opacity: inHours ? 1 : 0.5 }} />
            </Pressable>
          );
        })}
        {items.map((v) => {
          const top = ((v.mins - first * 60) / 60) * HOUR + 2;
          const height = Math.max(40, (Math.max(20, v.minutes) / 60) * HOUR - 4);
          const blocked = v.kind === 'blocked';
          const isNext = nextVisit?.id === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => {
                if (blocked) {
                  Alert.alert('Unblock this time?', v.label, [
                    { text: 'Keep blocked', style: 'cancel' },
                    { text: 'Unblock', onPress: () => attempt(removeBlock(v.id), "Couldn't unblock") },
                  ]);
                } else if (v.caseId) router.push({ pathname: '/case/[id]', params: { id: v.caseId } });
              }}
              onLongPress={
                !blocked && v.status === 'upcoming'
                  ? () =>
                      Alert.alert(`Cancel ${v.patientName}'s visit?`, "They'll be told straight away and won't be charged.", [
                        { text: 'Keep it', style: 'cancel' },
                        { text: 'Cancel visit', style: 'destructive', onPress: () => attempt(cancelAppointment(v.id), "Couldn't cancel") },
                      ])
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={`${time(v.start)}, ${blocked ? v.label : `${v.patientName}, ${v.label}`}`}
              accessibilityHint={blocked ? 'Unblocks this time' : 'Opens the case. Long press to cancel.'}
              style={{
                position: 'absolute',
                top,
                left: 52,
                right: 0,
                height,
                borderRadius: radius.control - 4,
                paddingHorizontal: space.sm + 2,
                paddingVertical: 5,
                backgroundColor: blocked ? colors.surfaceMuted : isNext ? colors.clinician : colors.clinicianWash,
                opacity: v.status === 'done' ? 0.6 : 1,
              }}>
              <Txt variant="smallStrong" style={{ color: blocked ? colors.textSecondary : isNext ? colors.onFill : colors.clinicianDeep }} numberOfLines={1}>
                {blocked ? v.label : v.patientName}
              </Txt>
              {!blocked ? (
                <Txt variant="caption" style={{ color: isNext ? 'rgba(255,255,255,0.85)' : colors.textSecondary }} numberOfLines={1}>
                  {time(v.start).replace(' pm', '').replace(' am', '')}, {v.service ? SERVICE_META[v.service].short.toLowerCase() : ''}
                  {isNext ? ', next' : v.status === 'done' ? ', done' : ''}
                </Txt>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Txt variant="caption" color="muted" align="center">
        Tap an open hour to block it. Long-press a visit to cancel it.
      </Txt>
    </Screen>
  );
}

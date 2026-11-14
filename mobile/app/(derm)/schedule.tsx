import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { IconButton, List, Screen, Txt } from '@/components/ui/kit';
import { daysBetween, shortDay, time } from '@/lib/format';
import { nextDays } from '@/lib/slots';
import { useApp } from '@/store/AppStore';
import { concernScale } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function clockToMinutes(s: string): number {
  const m = /(\d+):(\d+)\s*(am|pm)/i.exec(s);
  if (!m) return 0;
  return ((Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(m[2]);
}

/** H5 Schedule: tap a visit to open its case; tune for availability. */
export default function Schedule() {
  const { colors } = useTheme();
  const s = useApp();
  const days = useMemo(() => nextDays(7), []);
  const [day, setDay] = useState(0);
  const sel = days[day];
  const rule = s.derm.availability.days.find((d) => d.day === shortDay(sel));

  const items = useMemo(() => {
    const visits = s.derm.visits.filter((v) => daysBetween(v.start, sel) === 0).map((v) => ({ ...v, mins: new Date(v.start).getHours() * 60 + new Date(v.start).getMinutes() }));
    if (!rule?.open) return visits;
    const open: typeof visits = [];
    for (let m = clockToMinutes(rule.from); m < clockToMinutes(rule.to); m += 60) {
      if (!visits.some((v) => Math.abs(v.mins - m) < 45)) {
        const t = new Date(sel);
        t.setHours(Math.floor(m / 60), m % 60, 0, 0);
        open.push({ id: `open-${m}`, start: t.toISOString(), minutes: 30, kind: 'visit', label: 'Open', mins: m });
      }
    }
    return [...visits, ...open].sort((a, b) => a.mins - b.mins);
  }, [s.derm.visits, sel, rule]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
        <Txt variant="title">Schedule</Txt>
        <IconButton icon="tune" label="Availability" onPress={() => router.push('/availability')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {days.map((x, i) => {
          const active = i === day;
          return (
            <Pressable
              key={x.toISOString()}
              onPress={() => setDay(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{ width: 52, paddingVertical: space.sm, alignItems: 'center', borderRadius: radius.control, backgroundColor: active ? colors.clinician : colors.surface, borderWidth: 1, borderColor: active ? colors.clinician : colors.border }}>
              <Txt variant="caption" style={{ color: active ? colors.onFill : colors.textSecondary }}>
                {shortDay(x)}
              </Txt>
              <Txt variant="heading" style={{ color: active ? colors.onFill : colors.textPrimary }}>
                {x.getDate()}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      {!rule?.open && items.length === 0 ? (
        <Txt variant="body" color="secondary">
          You&apos;re closed on {shortDay(sel)}s. Change this in availability.
        </Txt>
      ) : (
        <List>
          {items.map((v) => {
            const isOpen = v.label === 'Open';
            const blocked = v.kind === 'blocked';
            return (
              <Pressable
                key={v.id}
                disabled={!v.caseId}
                onPress={() => v.caseId && router.push({ pathname: '/case/[id]', params: { id: v.caseId } })}
                accessibilityRole={v.caseId ? 'button' : undefined}
                style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, backgroundColor: pressed ? colors.surfaceMuted : 'transparent' })}>
                <Txt variant="smallStrong" color="secondary" style={{ width: 56 }}>
                  {time(v.start).replace(' pm', '').replace(' am', '')}
                </Txt>
                <View
                  style={{
                    flex: 1,
                    borderRadius: radius.control,
                    padding: space.md,
                    backgroundColor: blocked ? colors.surfaceMuted : isOpen ? 'transparent' : colors.clinicianWash,
                    borderWidth: isOpen ? 1 : 0,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                    borderLeftWidth: isOpen || blocked ? (isOpen ? 1 : 0) : 4,
                    borderLeftColor: isOpen ? colors.border : concernScale.Mild,
                  }}>
                  <Txt variant={isOpen ? 'small' : 'smallStrong'} color={isOpen || blocked ? 'secondary' : 'clinician'}>
                    {v.patientName ? `${v.patientName} · ${v.label}` : v.label}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </List>
      )}
    </Screen>
  );
}

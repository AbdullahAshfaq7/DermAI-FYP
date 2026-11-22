import { useState } from 'react';
import { Switch, View } from 'react-native';

import { usePicker } from '@/components/PickerSheet';
import { Button, ErrorBanner, Field, List, Row, Screen, Segmented, TopBar, Txt } from '@/components/ui/kit';
import type { Availability as AvailabilityT } from '@/data/types';
import { back } from '@/lib/nav';
import { addDays, dayMonth, todayKey } from '@/lib/format';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const HOURS = ['8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm'];

/** H6 Availability: feeds the patient's slot picker (E5). */
export default function Availability() {
  const { colors } = useTheme();
  const state = useApp();
  const { setAvailability } = useActions();
  const { busy, error, setError, run } = useSubmit();
  const [sheet, pick] = usePicker();
  const [a, setA] = useState<AvailabilityT>(state.derm.availability);
  const [custom, setCustom] = useState(false);
  const [offFrom, setOffFrom] = useState(a.timeOff?.from ?? '');
  const [offTo, setOffTo] = useState(a.timeOff?.to ?? '');
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  const setDays = (names: string[], patch: Partial<AvailabilityT['days'][number]>) =>
    setA((x) => ({ ...x, days: x.days.map((d) => (names.includes(d.day) ? { ...d, ...patch } : d)) }));

  const pickHours = (names: string[], label: string) =>
    pick(
      `${label}: start`,
      HOURS.slice(0, -1).map((from) => ({
        label: from,
        onPress: () =>
          setTimeout(
            () =>
              pick(
                `${label}: finish`,
                HOURS.filter((h) => HOURS.indexOf(h) > HOURS.indexOf(from)).map((to) => ({ label: to, onPress: () => setDays(names, { open: true, from, to }) })),
                `Starting ${from}`,
              ),
            350,
          ),
      })),
    );

  const timeOffLabel = a.timeOff ? (a.timeOff.from === a.timeOff.to ? dayMonth(`${a.timeOff.from}T12:00:00`) : `${dayMonth(`${a.timeOff.from}T12:00:00`)} to ${dayMonth(`${a.timeOff.to}T12:00:00`)}`) : 'None';
  const setTimeOff = (from: string, to: string) => setA((x) => ({ ...x, timeOff: { from, to } }));

  const save = async () => {
    let next = a;
    if (custom) {
      if (!ISO.test(offFrom) || !ISO.test(offTo)) return setError('Enter time off dates as YYYY-MM-DD.');
      if (offTo < offFrom) return setError('Time off must end on or after the day it starts.');
      next = { ...a, timeOff: { from: offFrom, to: offTo } };
    }
    if ((await run(() => setAvailability(next))) === undefined) return;
    back('/today');
  };

  const groups: { label: string; names: string[] }[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({ label: d, names: [d] }));

  return (
    <Screen
      header={<TopBar title="Availability" />}
      footer={
        <Button label="Save hours" loading={busy} onPress={() => void save()} />
      }>
      <ErrorBanner error={error} />
      <List>
        {groups.map((g) => {
          const d = a.days.find((x) => x.day === g.names[0])!;
          return (
            <Row
              key={g.label}
              muted={!d.open}
              title={
                <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                  <Txt variant="bodyStrong" style={{ width: 38 }}>
                    {g.label}
                  </Txt>
                  <Txt variant="small" color="secondary">
                    {d.open ? `${d.from} to ${d.to}` : 'Off'}
                  </Txt>
                </View>
              }
              label={`${g.label}, ${d.open ? `${d.from} to ${d.to}` : 'off'}`}
              onPress={() => pickHours(g.names, g.label)}
              action={
                <Switch
                  value={d.open}
                  onValueChange={(v) => (v ? pickHours(g.names, g.label) : setDays(g.names, { open: false }))}
                  accessibilityLabel={`Open on ${g.label}`}
                  trackColor={{ true: colors.clinician, false: colors.border }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          );
        })}
      </List>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">Gap between visits</Txt>
        <Segmented
          value={String(a.gapMinutes) as '0' | '10' | '15'}
          onChange={(v) => setA((x) => ({ ...x, gapMinutes: Number(v) }))}
          options={[
            { value: '0', label: 'None' },
            { value: '10', label: '10 min' },
            { value: '15', label: '15 min' },
          ]}
        />
      </View>
      <List>
        <Row
          title={`Book at least ${a.noticeHours} hours ahead`}
          chevron
          onPress={() => pick('Minimum notice', [1, 3, 6, 12, 24].map((n) => ({ label: `${n} hours`, selected: a.noticeHours === n, onPress: () => setA((x) => ({ ...x, noticeHours: n })) })))}
        />
        <Row
          title="Time off"
          value={custom ? 'Custom' : timeOffLabel}
          chevron
          onPress={() => {
            const today = new Date();
            pick(
              'Time off',
              [
                { label: 'None', selected: !a.timeOff && !custom, onPress: () => (setCustom(false), setA((x) => ({ ...x, timeOff: null }))) },
                { label: 'Tomorrow', onPress: () => (setCustom(false), setTimeOff(todayKey(addDays(today, 1)), todayKey(addDays(today, 1)))) },
                { label: 'The next 7 days', onPress: () => (setCustom(false), setTimeOff(todayKey(today), todayKey(addDays(today, 6)))) },
                { label: 'Pick dates…', selected: custom, onPress: () => setCustom(true) },
              ],
              "Patients can't book you on these dates.",
            );
          }}
        />
      </List>
      {custom ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Field label="From" value={offFrom} onChangeText={setOffFrom} placeholder="2026-12-20" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="To" value={offTo} onChangeText={setOffTo} placeholder="2026-12-24" />
          </View>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: space.xs }}>
        <Txt variant="small" color="secondary">
          Patients pick from these hours in 30-minute slots, minus visits already booked and blocked time.
        </Txt>
      </View>
      {sheet}
    </Screen>
  );
}

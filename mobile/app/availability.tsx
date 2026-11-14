import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { Button, List, Row, Screen, TopBar, Txt } from '@/components/ui/kit';
import type { Availability as AvailabilityT } from '@/data/types';
import { back } from '@/lib/nav';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const HOURS = ['9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu'];

/** H6 Availability: feeds the patient's slot picker (E5). */
export default function Availability() {
  const { colors } = useTheme();
  const { state, update } = useStore();
  const [a, setA] = useState<AvailabilityT>(state.derm.availability);

  const setDays = (names: string[], patch: Partial<AvailabilityT['days'][number]>) =>
    setA((x) => ({ ...x, days: x.days.map((d) => (names.includes(d.day) ? { ...d, ...patch } : d)) }));

  const pickHours = (names: string[], label: string) =>
    Alert.alert(`${label}: start`, undefined, [
      ...HOURS.slice(0, 8).map((from) => ({
        text: from,
        onPress: () =>
          Alert.alert(`${label}: finish`, undefined, [
            ...HOURS.filter((h) => HOURS.indexOf(h) > HOURS.indexOf(from)).slice(0, 7).map((to) => ({ text: to, onPress: () => setDays(names, { open: true, from, to }) })),
            { text: 'Cancel', style: 'cancel' as const },
          ]),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const groups: { label: string; names: string[] }[] = [
    { label: 'Mon to Thu', names: WEEKDAYS },
    { label: 'Friday', names: ['Fri'] },
    { label: 'Saturday', names: ['Sat'] },
    { label: 'Sunday', names: ['Sun'] },
  ];

  return (
    <Screen
      header={<TopBar title="Availability" />}
      footer={
        <Button
          label="Save hours"
          variant="clinician"
          onPress={() => {
            update((s) => ({ ...s, derm: { ...s.derm, availability: a } }));
            back('/today');
          }}
        />
      }>
      <List>
        {groups.map((g) => {
          const d = a.days.find((x) => x.day === g.names[0])!;
          return (
            <Row
              key={g.label}
              title={g.label}
              subtitle={d.open ? `${d.from} to ${d.to}` : 'Closed'}
              onPress={() => pickHours(g.names, g.label)}
              right={
                <Switch
                  value={d.open}
                  onValueChange={(v) => (v ? pickHours(g.names, g.label) : setDays(g.names, { open: false }))}
                  accessibilityLabel={`Open on ${g.label}`}
                  trackColor={{ true: colors.clinician, false: colors.surfaceMuted }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          );
        })}
      </List>
      <List>
        <Row
          title="Gap between visits"
          value={`${a.gapMinutes} min`}
          chevron
          onPress={() => Alert.alert('Gap between visits', undefined, [...[0, 5, 10, 15].map((n) => ({ text: `${n} min`, onPress: () => setA({ ...a, gapMinutes: n }) })), { text: 'Cancel', style: 'cancel' as const }])}
        />
        <Row
          title={`Book at least ${a.noticeHours} hours ahead`}
          chevron
          onPress={() => Alert.alert('Minimum notice', undefined, [...[1, 3, 6, 24].map((n) => ({ text: `${n} hours`, onPress: () => setA({ ...a, noticeHours: n }) })), { text: 'Cancel', style: 'cancel' as const }])}
        />
        <Row
          title="Time off"
          value={a.timeOff || 'None'}
          chevron
          onPress={() => Alert.alert('Time off', 'Patients can\'t book you on these dates.', [{ text: '20 to 24 Dec', onPress: () => setA({ ...a, timeOff: '20 to 24 Dec' }) }, { text: 'None', onPress: () => setA({ ...a, timeOff: '' }) }, { text: 'Cancel', style: 'cancel' }])}
        />
      </List>
      <View style={{ paddingHorizontal: space.xs }}>
        <Txt variant="small" color="secondary">
          Patients pick from these hours in 30-minute slots, minus visits already booked.
        </Txt>
      </View>
    </Screen>
  );
}

import { Alert } from 'react-native';

import { AvoidPicker } from '@/components/AvoidPicker';
import { List, Row, Screen, Segmented, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import { useStore } from '@/store/AppStore';
import type { RoutinePrefs } from '@/store/state';

const AM = ['6:30 am', '7:00 am', '7:30 am', '8:00 am', '9:00 am'];
const PM = ['9:00 pm', '9:30 pm', '10:00 pm', '10:30 pm', '11:00 pm'];

/** F8 Routine preferences: reminder times and limits that shape D2. */
export default function RoutinePreferences() {
  const { state, update } = useStore();
  const p = state.routinePrefs;
  const set = (patch: Partial<RoutinePrefs>) => update((s) => ({ ...s, routinePrefs: { ...s.routinePrefs, ...patch } }));
  const pick = (title: string, options: string[], key: 'amTime' | 'pmTime') =>
    Alert.alert(title, undefined, [...options.map((o) => ({ text: o, onPress: () => set({ [key]: o }) })), { text: 'Cancel', style: 'cancel' as const }]);

  return (
    <Screen header={<TopBar title="Routine preferences" />}>
      <Txt variant="heading">Reminders</Txt>
      <List>
        <Row icon="wb-sunny" title="Morning routine" subtitle={`${p.amTime}, every day`} chevron onPress={() => pick('Morning reminder', AM, 'amTime')} />
        <Row icon="bedtime" title="Night routine" subtitle={`${p.pmTime}, every day`} chevron onPress={() => pick('Night reminder', PM, 'pmTime')} />
      </List>
      <Txt variant="heading">Routine length</Txt>
      <Segmented
        value={String(p.length) as '3' | '4' | '6'}
        onChange={(v) => set({ length: Number(v) as 3 | 4 | 6 })}
        options={[
          { value: '3', label: 'Minimal · 3' },
          { value: '4', label: 'Standard · 4' },
          { value: '6', label: 'Full · 6' },
        ]}
      />
      <Txt variant="heading">Budget</Txt>
      <Segmented
        value={p.budget}
        onChange={(v) => set({ budget: v })}
        options={[
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Any', label: 'Any' },
        ]}
      />
      <Txt variant="heading">Always avoid</Txt>
      <AvoidPicker value={state.profile.avoid} onChange={(avoid) => update((s) => ({ ...s, profile: { ...s.profile, avoid } }))} />
      <List>
        <ToggleRow title="Rebuild after each scan" subtitle="Update steps when results change" value={p.rebuild} onChange={(v) => set({ rebuild: v })} />
      </List>
    </Screen>
  );
}

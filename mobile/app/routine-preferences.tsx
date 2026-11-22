import { View } from 'react-native';

import { AvoidPicker } from '@/components/AvoidPicker';
import { Chip, List, Row, Screen, Segmented, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import type { RoutinePrefs } from '@/store/state';
import { space } from '@/theme/tokens';

const BUDGET: { value: RoutinePrefs['budget']; label: string; note: string }[] = [
  { value: 'Low', label: 'Under Rs 1,500', note: 'Pharmacy basics only.' },
  { value: 'Medium', label: 'Rs 1,500 to 4,000', note: 'Adds mid-range serums like niacinamide.' },
  { value: 'Any', label: 'Any', note: 'Includes premium steps like vitamin C.' },
];

/** F8 Routine preferences: limits that shape what D2 suggests. Reminder times live in Settings. */
export default function RoutinePreferences() {
  const state = useApp();
  const { updatePrefs, updateProfile } = useActions();
  const p = state.routinePrefs;
  const set = (patch: Partial<RoutinePrefs>) => attempt(updatePrefs(patch));
  const doctorCount = (p.doctorSteps ?? []).length;

  return (
    <Screen header={<TopBar title="Routine preferences" />}>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">Steps per routine</Txt>
        <Segmented
          value={String(p.length) as '2' | '3' | '4' | '5'}
          onChange={(v) => set({ length: Number(v) as RoutinePrefs['length'] })}
          options={[
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
          ]}
        />
        {doctorCount ? (
          <Txt variant="caption" color="muted">
            Plus {doctorCount} step{doctorCount === 1 ? '' : 's'} your dermatologist added.
          </Txt>
        ) : null}
      </View>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">Budget per product</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {BUDGET.map((b) => (
            <Chip key={b.value} label={b.label} selected={p.budget === b.value} onPress={() => set({ budget: b.value })} />
          ))}
        </View>
        <Txt variant="caption" color="muted">
          {BUDGET.find((b) => b.value === p.budget)?.note}
        </Txt>
      </View>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">Always avoid</Txt>
        <AvoidPicker value={state.profile.avoid} onChange={(avoid) => attempt(updateProfile({ avoid }))} />
      </View>
      <List>
        <ToggleRow icon="autorenew" iconTone="muted" title="Rebuild after each scan" subtitle="Drop treatments for concerns that read clear; focus on the worst" value={p.rebuild} onChange={(v) => set({ rebuild: v })} />
        {p.removed.length ? (
          <Row icon="restore" iconTone="muted" title={`${p.removed.length} step${p.removed.length === 1 ? '' : 's'} removed`} subtitle="By you or your dermatologist" value="Restore all" onPress={() => set({ removed: [] })} />
        ) : null}
      </List>
    </Screen>
  );
}

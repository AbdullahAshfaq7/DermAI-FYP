import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Button, List, Row, Screen, Segmented, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import type { ThemePreference } from '@/theme/colors';
import { resetTo } from '@/lib/nav';
import { useActions, useStore } from '@/store/AppStore';
import type { Settings as SettingsT } from '@/store/state';
import { useTheme } from '@/theme/ThemeProvider';

const QUIET = [
  ['10 pm', '7 am'],
  ['11 pm', '7 am'],
  ['12 am', '8 am'],
] as const;

/** F3 Settings: appearance, reminders, language (Urdu later). Shared by both roles. */
export default function Settings() {
  const { preference, setPreference } = useTheme();
  const { state, update } = useStore();
  const { logOut } = useActions();
  const set = (patch: Partial<SettingsT>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const st = state.settings;
  const prefs = state.routinePrefs;
  const derm = state.session?.role === 'dermatologist';

  return (
    <Screen header={<TopBar title="Settings" />}>
      <Txt variant="heading">Appearance</Txt>
      <Segmented<ThemePreference>
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />
      <Txt variant="heading">{derm ? 'Alerts' : 'Reminders'}</Txt>
      <List>
        {derm ? null : (
          <>
            <ToggleRow title="Morning routine" subtitle={prefs.amTime} value={st.remindAm} onChange={(v) => set({ remindAm: v })} />
            <ToggleRow title="Evening routine" subtitle={prefs.pmTime} value={st.remindPm} onChange={(v) => set({ remindPm: v })} />
            <ToggleRow title="Rescan reminder" subtitle={`Every ${st.rescanDays} days`} value={st.remindRescan} onChange={(v) => set({ remindRescan: v })} />
          </>
        )}
        <ToggleRow title="Quiet hours" subtitle={`${st.quietFrom} to ${st.quietTo}`} value={st.quiet} onChange={(v) => set({ quiet: v })} />
        <Row
          title="Quiet hours window"
          value={`${st.quietFrom} to ${st.quietTo}`}
          chevron
          onPress={() =>
            Alert.alert('Quiet hours', 'No reminders between:', [
              ...QUIET.map(([a, b]) => ({ text: `${a} to ${b}`, onPress: () => set({ quietFrom: a, quietTo: b }) })),
              { text: 'Cancel', style: 'cancel' as const },
            ])
          }
        />
        {derm ? null : (
          <Row
            title="Rescan every"
            value={`${st.rescanDays} days`}
            chevron
            onPress={() =>
              Alert.alert('Rescan every', undefined, [
                ...[7, 10, 14, 30].map((n) => ({ text: `${n} days`, onPress: () => set({ rescanDays: n }) })),
                { text: 'Cancel', style: 'cancel' as const },
              ])
            }
          />
        )}
      </List>
      <List>
        <Row
          title="Language"
          value={st.language}
          chevron
          onPress={() => Alert.alert('Language', 'Urdu is coming in a later version. DermAI is in English for now.')}
        />
        {derm ? null : <Row title="Privacy and data" chevron onPress={() => router.push('/privacy')} />}
        <Row title="Help and about" chevron onPress={() => router.push('/about')} />
      </List>
      <Button
        label="Log out"
        variant="destructive"
        onPress={() =>
          Alert.alert('Log out?', state.session?.demo ? 'Demo data on this device will reset.' : 'You\'ll need to sign in again. Data on this device will be cleared.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Log out',
              style: 'destructive',
              onPress: () => {
                logOut();
                resetTo('/welcome');
              },
            },
          ])
        }
      />
    </Screen>
  );
}

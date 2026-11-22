import { router } from 'expo-router';
import { Alert } from 'react-native';

import { usePicker } from '@/components/PickerSheet';

import { Button, List, Row, Screen, Segmented, StatusPill, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import type { ThemePreference } from '@/theme/colors';
import { resetTo } from '@/lib/nav';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import type { Settings as SettingsT } from '@/store/state';
import { useTheme } from '@/theme/ThemeProvider';

const AM = ['6:00 am', '6:30 am', '7:00 am', '7:30 am', '8:00 am', '8:30 am', '9:00 am'];
const PM = ['8:30 pm', '9:00 pm', '9:30 pm', '10:00 pm', '10:30 pm', '11:00 pm'];

const QUIET = [
  ['10 pm', '7 am'],
  ['11 pm', '7 am'],
  ['12 am', '8 am'],
] as const;

/** F3 Settings: appearance, reminders, language (Urdu later). Shared by both roles. */
export default function Settings() {
  const { preference, setPreference } = useTheme();
  const state = useApp();
  const { logOut, updateSettings, updatePrefs } = useActions();
  const [sheet, pick] = usePicker();
  const set = (patch: Partial<SettingsT>) => attempt(updateSettings(patch));
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
          { value: 'system', label: 'Match phone' },
        ]}
      />
      <Txt variant="heading">{derm ? 'Alerts' : 'Reminders'}</Txt>
      <List>
        {derm ? null : (
          <>
            <ToggleRow icon="light-mode" iconTone="peach" title="Morning routine" subtitle={prefs.amTime} value={st.remindAm} onChange={(v) => set({ remindAm: v })} />
            <ToggleRow icon="dark-mode" title="Evening routine" subtitle={prefs.pmTime} value={st.remindPm} onChange={(v) => set({ remindPm: v })} />
            <ToggleRow icon="center-focus-strong" iconTone="muted" title="Scan reminder" subtitle={st.rescanDays % 7 === 0 ? `Every ${st.rescanDays / 7 === 1 ? 'week' : `${st.rescanDays / 7} weeks`}` : `Every ${st.rescanDays} days`} value={st.remindRescan} onChange={(v) => set({ remindRescan: v })} />
            <Row
              icon="schedule"
              iconTone="muted"
              title="Reminder times"
              value={`${prefs.amTime} · ${prefs.pmTime}`}
              chevron
              onPress={() =>
                pick('Morning reminder', AM.map((t) => ({ label: t, selected: prefs.amTime === t, onPress: () => {
                  attempt(updatePrefs({ amTime: t }));
                  setTimeout(() => pick('Evening reminder', PM.map((p) => ({ label: p, selected: prefs.pmTime === p, onPress: () => attempt(updatePrefs({ pmTime: p })) }))), 350);
                } })))
              }
            />
          </>
        )}
        <ToggleRow icon="bedtime" iconTone="muted" title="Quiet hours" subtitle={`${st.quietFrom} to ${st.quietTo}`} value={st.quiet} onChange={(v) => set({ quiet: v })} />
        <Row
          icon="nights-stay"
          iconTone="muted"
          title="Quiet hours window"
          value={`${st.quietFrom} to ${st.quietTo}`}
          chevron
          onPress={() =>
            pick(
              'Quiet hours',
              QUIET.map(([a, b]) => ({ label: `${a} to ${b}`, selected: st.quietFrom === a && st.quietTo === b, onPress: () => set({ quietFrom: a, quietTo: b }) })),
              'No reminders between:',
            )
          }
        />
        {derm ? null : (
          <Row
            icon="event-repeat"
            iconTone="muted"
            title="Scan every"
            value={`${st.rescanDays} days`}
            chevron
            onPress={() =>
              pick(
                'Rescan every',
                [7, 10, 14, 21, 30].map((n) => ({ label: `${n} days`, selected: st.rescanDays === n, onPress: () => set({ rescanDays: n }) })),
              )
            }
          />
        )}
      </List>
      <List>
        <Row
          icon="translate"
          iconTone="muted"
          title="Language"
          subtitle="English"
          right={<StatusPill label="Urdu soon" tone="neutral" />}
          onPress={() => Alert.alert('Language', 'Urdu is coming in a later version. DermAI is in English for now.')}
        />
        {derm ? null : <Row icon="admin-panel-settings" iconTone="muted" title="Privacy and data" chevron onPress={() => router.push('/privacy')} />}
        <Row icon="info-outline" iconTone="muted" title="About DermAI" chevron onPress={() => router.push('/about')} />
      </List>
      {derm ? (
        <List>
          <Row title="Delete account" destructive onPress={() => router.push('/delete-account')} />
        </List>
      ) : null}
      <Button
        label="Log out"
        variant="secondary"
        onPress={() =>
          Alert.alert('Log out?', "You'll need to sign in again. Your data stays safe on your account.", [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Log out',
              style: 'destructive',
              onPress: async () => {
                await logOut();
                resetTo('/welcome');
              },
            },
          ])
        }
      />
      {sheet}
    </Screen>
  );
}

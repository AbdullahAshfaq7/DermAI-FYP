import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Share } from 'react-native';

import { Avatar, Button, List, Row, Screen, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import { DOCTORS } from '@/data/seed';
import { dayMonth } from '@/lib/format';
import { resetTo } from '@/lib/nav';
import { useActions, useStore } from '@/store/AppStore';

/** F4 Privacy and data: sharing is visible and can be stopped. */
export default function Privacy() {
  const { state, update } = useStore();
  const { stopSharing, logOut } = useActions();
  const st = state.settings;

  const exportData = async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      account: state.session,
      profile: state.profile,
      scans: state.scans.map(({ photoUri: _p, ...rest }) => rest),
      routinePreferences: state.routinePrefs,
      appointments: state.appointments,
      messages: state.threads,
      saved: state.saved,
    };
    try {
      const path = `${FileSystem.cacheDirectory}dermai-export.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      await Share.share({ url: path, title: 'DermAI data export', message: 'My DermAI data (scores, profile and notes).' });
    } catch {
      Alert.alert('Couldn\'t export', 'Try again in a moment.');
    }
  };

  return (
    <Screen header={<TopBar title="Privacy and data" />}>
      <List>
        <ToggleRow
          title="Keep scan photos"
          subtitle={st.keepPhotos ? 'On: photos stay until you delete them' : 'Off: we keep scores and delete photos after 30 days'}
          value={st.keepPhotos}
          onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, keepPhotos: v } }))}
        />
        <ToggleRow
          title="Help improve DermAI"
          subtitle="Use my photos to train the model"
          value={st.train}
          onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, train: v }, consent: s.consent ? { ...s.consent, train: v } : s.consent }))}
        />
      </List>
      <Txt variant="heading">Shared with</Txt>
      {state.shares.length === 0 ? (
        <Txt variant="small" color="secondary">
          You haven&apos;t shared any scans. When you book a doctor you can choose which scans they see.
        </Txt>
      ) : (
        <List>
          {state.shares.map((sh) => {
            const d = DOCTORS.find((x) => x.id === sh.doctorId);
            if (!d) return null;
            return (
              <Row
                key={sh.doctorId}
                leading={<Avatar name={d.name} size={40} tone={d.tone} />}
                title={d.name}
                subtitle={`${sh.scanIds.length} scan${sh.scanIds.length === 1 ? '' : 's'}, until ${dayMonth(sh.until)}`}
                right={
                  <Button
                    label="Stop"
                    variant="destructive"
                    compact
                    onPress={() =>
                      Alert.alert(`Stop sharing with ${d.name}?`, 'They won\'t see your scans any more. Messages stay.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Stop sharing', style: 'destructive', onPress: () => stopSharing(sh.doctorId) },
                      ])
                    }
                  />
                }
              />
            );
          })}
        </List>
      )}
      <List>
        <Row icon="download" title="Download my data" subtitle="Scores, profile and notes as a file" chevron onPress={exportData} />
        <Row
          icon="delete-forever"
          title="Delete account"
          subtitle="Removes everything within 7 days"
          destructive
          onPress={() =>
            Alert.alert('Delete your account?', 'Your scans, photos, routine and messages will be removed within 7 days. This can\'t be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete account',
                style: 'destructive',
                onPress: () => {
                  logOut();
                  resetTo('/welcome');
                },
              },
            ])
          }
        />
      </List>
    </Screen>
  );
}

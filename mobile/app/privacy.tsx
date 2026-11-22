import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Avatar, Button, Card, List, Row, Screen, Segmented, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import { shareTextFile } from '@/lib/exportFile';
import { dayMonth } from '@/lib/format';
import { useLocalPhotos } from '@/lib/localPhotos';
import { doctorById } from '@/lib/selectors';
import { alertError, attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import type { Settings } from '@/store/state';
import { space } from '@/theme/tokens';

/** F4 Privacy and data: photos stay on this phone; sharing is visible and can be stopped in one tap. */
export default function Privacy() {
  const state = useApp();
  const actions = useActions();
  const { stopSharing, updateSettings } = actions;
  const st = state.settings;
  const local = useLocalPhotos(state.session?.id);
  const photos = Object.values(local);
  const mb = photos.reduce((n, p) => n + p.bytes, 0) / (1024 * 1024);

  const [exporting, setExporting] = useState(false);
  const exportData = async () => {
    setExporting(true);
    try {
      await shareTextFile('dermai-export.json', await actions.exportData());
    } catch (e) {
      alertError(e, "Couldn't export");
    } finally {
      setExporting(false);
    }
  };

  const setRetention = (v: Settings['photoRetention']) => {
    if (v === st.photoRetention) return;
    const shorter = (st.photoRetention === 'always' && v !== 'always') || (st.photoRetention === '1y' && v === '3m');
    if (!shorter) return attempt(updateSettings({ photoRetention: v }));
    Alert.alert('Keep photos for less time?', 'Photos older than that are deleted from this phone now. Scores stay.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete older photos', style: 'destructive', onPress: () => attempt(updateSettings({ photoRetention: v })) },
    ]);
  };

  return (
    <Screen header={<TopBar title="Privacy and data" />}>
      <Card tone="brand">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">On this phone</Txt>
          <Txt variant="caption" color="muted">
            {mb < 0.1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`}
          </Txt>
        </View>
        <Txt variant="title" style={{ marginTop: 4 }}>
          {photos.length} scan photo{photos.length === 1 ? '' : 's'}
        </Txt>
        <Txt variant="small" color="secondary" style={{ marginTop: 2 }}>
          We read each photo to score it, then delete our copy. Your scores are kept on your account.
        </Txt>
      </Card>
      <Txt variant="heading">Keep photos for</Txt>
      <Segmented
        value={st.photoRetention}
        onChange={setRetention}
        options={[
          { value: '3m', label: '3 months' },
          { value: '1y', label: '1 year' },
          { value: 'always', label: 'Always' },
        ]}
      />
      <Txt variant="heading">Who can see your scans</Txt>
      {state.shares.length === 0 ? (
        <Txt variant="small" color="secondary">
          No one. When you book a doctor you choose which scans they see, and for how long.
        </Txt>
      ) : (
        state.shares.map((sh) => {
          const d = doctorById(state, sh.doctorId) ?? { name: 'A doctor no longer listed', tone: 2, photoUrl: null };
          const dates = sh.scanIds.map((id) => state.scans.find((x) => x.id === id)).filter((x) => !!x).map((x) => dayMonth(x!.date));
          return (
            <Card key={sh.doctorId} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={d.name} size={34} tone={d.tone} uri={d.photoUrl} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{d.name}</Txt>
                <Txt variant="caption" color="muted">
                  {dates.length ? `Scans from ${dates.slice(0, 2).join(', ')}${dates.length > 2 ? ` and ${dates.length - 2} more` : ''}` : 'Scans'} · until {dayMonth(sh.until)}
                </Txt>
              </View>
              <Button
                label="Stop sharing"
                variant="destructive"
                compact
                onPress={() =>
                  Alert.alert(`Stop sharing with ${d.name}?`, "They won't see your scans any more, and their copy of the photos is deleted. Messages stay.", [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Stop sharing', style: 'destructive', onPress: () => attempt(stopSharing(sh.doctorId), "Couldn't stop sharing") },
                  ])
                }
              />
            </Card>
          );
        })
      )}
      <List>
        <ToggleRow icon="model-training" iconTone="muted" title="Help improve DermAI" subtitle="Anonymised scans, only if you say yes" value={st.train} onChange={(v) => attempt(updateSettings({ train: v }))} />
        <Row icon="download" iconTone="muted" title="Export my data" subtitle={exporting ? 'Preparing your file…' : 'Everything on your account, as a file'} chevron onPress={exporting ? undefined : () => void exportData()} />
        <Row icon="delete" destructive title="Delete account and photos" chevron onPress={() => router.push('/delete-account')} />
      </List>
    </Screen>
  );
}

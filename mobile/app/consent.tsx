import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, ErrorBanner, List, Screen, Tick, TopBar, Txt } from '@/components/ui/kit';
import { errorMessage } from '@/lib/api';
import { homeFor } from '@/lib/nav';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

function CheckRow({ title, note, value, onChange }: { title: string; note: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`${title}. ${note}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md + 2, paddingVertical: space.md, minHeight: 56 }}>
      <Tick on={value} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" color="muted">
          {note}
        </Txt>
      </View>
    </Pressable>
  );
}

/** A5 Consent: age and photo consent before the camera ever opens. */
export default function Consent() {
  const { colors } = useTheme();
  const state = useApp();
  const { giveConsent } = useActions();
  const derm = state.session?.role === 'dermatologist';
  const [adult, setAdult] = useState(false);
  const [keep, setKeep] = useState(derm);
  const [train, setTrain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen
      header={<TopBar right={<Txt variant="small" color="secondary">3 of 3</Txt>} />}
      footer={
        <>
          <Button
            label="Agree and continue"
            disabled={!adult || !keep}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                const r = await giveConsent(adult, train);
                router.replace(homeFor(r.state));
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Txt variant="small" color="brand" align="center" onPress={() => router.push('/about')}>
            Read the privacy policy and terms
          </Txt>
        </>
      }>
      <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="admin-panel-settings" size={26} color={colors.brandDeep} />
      </View>
      <Txt variant="display">{derm ? 'Before you start' : 'Before your first scan'}</Txt>
      <ErrorBanner error={error} />
      <List>
        <CheckRow title={derm ? "I'm 18 or older" : "I'm 18 or older, or have a parent's consent"} note="Required" value={adult} onChange={setAdult} />
        {derm ? null : <CheckRow title="Keep my scan photos on this phone" note="Required to compare scans" value={keep} onChange={setKeep} />}
        <CheckRow
          title="Help improve DermAI"
          note={derm ? 'Use my verdicts on AI readings for training. Optional.' : 'Share anonymised scans for training. Optional, change any time.'}
          value={train}
          onChange={setTrain}
        />
      </List>
      <Card tone="brand" style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
        <Icon name="lock" size={20} color={colors.brandDeep} />
        <Txt variant="small" color="brandDeep" style={{ flex: 1 }}>
          {derm ? (
            <>
              <Txt variant="smallStrong" color="brandDeep">
                Patients&apos; photos stay on their phones.
              </Txt>{' '}
              You only see the scans a patient shares with you, and only until the share ends.
            </>
          ) : (
            <>
              <Txt variant="smallStrong" color="brandDeep">
                Your photos stay on your phone.
              </Txt>{' '}
              We read each one to score it, then delete our copy. A photo only leaves your phone again when you share it with a doctor.
            </>
          )}
        </Txt>
      </Card>
    </Screen>
  );
}

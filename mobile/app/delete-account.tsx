import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Banner, Button, ErrorBanner, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { resetTo } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** Delete account (FR-1, FR-23): removes scans, photos, messages and bookings for good. */
export default function DeleteAccount() {
  const s = useApp();
  const { deleteAccount } = useActions();
  const { busy, error, run } = useSubmit();
  const [password, setPassword] = useState('');
  const derm = s.session?.role === 'dermatologist';
  const upcoming = derm ? s.derm.visits.filter((v) => v.kind === 'visit' && v.status === 'upcoming').length : s.appointments.filter((a) => a.status === 'upcoming').length;

  const confirm = () =>
    Alert.alert('Delete your account for good?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: async () => {
          if ((await run(() => deleteAccount(password))) === undefined) return;
          resetTo('/welcome');
        },
      },
    ]);

  return (
    <Screen keyboard header={<TopBar title="Delete account" />} footer={<Button label="Delete my account" variant="destructive" disabled={!password} loading={busy} onPress={confirm} />}>
      <Txt variant="display">Delete your account</Txt>
      <View style={{ gap: space.sm }}>
        <Txt variant="body" color="secondary">
          {derm
            ? 'Your profile, credentials, cases and messages are deleted, and patients can no longer find you.'
            : 'Your scans, photos, routine, saved items and messages with doctors are deleted straight away.'}
        </Txt>
        {upcoming ? <Banner tone="watch" icon="event-busy" text={`You have ${upcoming} upcoming visit${upcoming === 1 ? '' : 's'}. ${derm ? 'Patients will be told they are cancelled.' : 'They will be cancelled.'}`} /> : null}
        <Txt variant="small" color="secondary">
          Want a copy first? Use Download my data in Privacy and data.
        </Txt>
      </View>
      <ErrorBanner error={error} />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" hint="Enter your password to confirm." />
    </Screen>
  );
}

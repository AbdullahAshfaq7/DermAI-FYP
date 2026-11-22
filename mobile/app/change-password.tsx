import { Alert } from 'react-native';
import { useState } from 'react';

import { Button, ErrorBanner, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { back } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useActions } from '@/store/AppStore';

/** F5 Change password. Signs out every other device. */
export default function ChangePassword() {
  const { changePassword } = useActions();
  const { busy, error, run } = useSubmit();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);

  const errors = {
    current: current ? null : 'Enter your current password.',
    next: next.length < 8 || !/\d/.test(next) ? 'At least 8 characters with one number.' : next === current ? 'Choose a new password.' : null,
    confirm: confirm !== next ? "Passwords don't match." : null,
  };

  const save = async () => {
    setTried(true);
    if (errors.current || errors.next || errors.confirm) return;
    if ((await run(() => changePassword(current, next))) === undefined) return;
    Alert.alert('Password changed', "You're still signed in here. Other devices will need the new password.");
    back('/personal');
  };

  return (
    <Screen keyboard header={<TopBar title="Change password" />} footer={<Button label="Change password" loading={busy} onPress={() => void save()} />}>
      <Txt variant="body" color="secondary">
        Changing your password signs you out on every other device.
      </Txt>
      <ErrorBanner error={error} />
      <Field label="Current password" value={current} onChangeText={setCurrent} secure autoCapitalize="none" error={tried ? errors.current : null} />
      <Field label="New password" value={next} onChangeText={setNext} secure autoCapitalize="none" hint="At least 8 characters with one number." error={tried ? errors.next : null} />
      <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secure autoCapitalize="none" error={tried ? errors.confirm : null} />
    </Screen>
  );
}

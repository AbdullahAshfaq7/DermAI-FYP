import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DEMO_DOCTOR_EMAIL, DEMO_PATIENT } from '@/data/seed';
import { resetTo } from '@/lib/nav';
import { useActions } from '@/store/AppStore';

/** Log in (linked from A2). There is no auth server yet, so this signs in to a demo account. */
export default function LogIn() {
  const { logIn } = useActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e = email) => {
    const role = logIn(e);
    resetTo(role === 'dermatologist' ? '/today' : '/home');
  };

  return (
    <Screen keyboard header={<TopBar />} footer={<Button label="Log in" onPress={() => submit()} />}>
      <Txt variant="display">Welcome back</Txt>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" />
      <Txt
        variant="smallStrong"
        color="brand"
        onPress={() => Alert.alert('Reset password', 'Password reset needs the auth service, which isn\'t connected yet.')}>
        Forgot password?
      </Txt>
      <Card tone="muted">
        <Txt variant="smallStrong">Demo accounts</Txt>
        <Txt variant="small" color="secondary" style={{ marginTop: 4 }}>
          Accounts aren&apos;t connected to a server yet. Tap one to explore with sample data.
        </Txt>
        <Button variant="secondary" compact label={`Patient · ${DEMO_PATIENT.email}`} style={{ marginTop: 12 }} onPress={() => submit(DEMO_PATIENT.email)} />
        <Button variant="secondary" compact label={`Dermatologist · ${DEMO_DOCTOR_EMAIL}`} style={{ marginTop: 8 }} onPress={() => submit(DEMO_DOCTOR_EMAIL)} />
      </Card>
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, ErrorBanner, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { errorMessage } from '@/lib/api';
import { homeFor, resetTo } from '@/lib/nav';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Log in (linked from A2). */
export default function LogIn() {
  const { colors } = useTheme();
  const { logIn } = useActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    email: !EMAIL.test(email.trim()) ? 'Enter the email you signed up with.' : null,
    password: password.length === 0 ? 'Enter your password.' : null,
  };

  const submit = async (e = email, p = password) => {
    setTried(true);
    setError(null);
    if (e === email && (errors.email || errors.password)) return;
    setBusy(true);
    try {
      const s = await logIn(e.trim(), p);
      resetTo(homeFor(s));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<TopBar />} footer={<Button label="Log in" loading={busy} onPress={() => void submit()} />}>
      <Txt variant="display">Welcome back</Txt>
      <ErrorBanner error={error} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={tried ? errors.email : null} />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure={!show}
        autoCapitalize="none"
        error={tried ? errors.password : null}
        right={
          <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} hitSlop={10}>
            <Icon name={show ? 'visibility-off' : 'visibility'} size={20} color={colors.textMuted} />
          </Pressable>
        }
      />
      <Txt variant="smallStrong" color="brand" onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}>
        Forgot password?
      </Txt>
      <Txt variant="small" color="secondary">
        DermAI staff?{' '}
        <Txt variant="smallStrong" color="brand" onPress={() => router.replace('/admin-login')}>
          Log in as admin
        </Txt>
      </Txt>
      {__DEV__ ? (
        <Card tone="muted">
          <Txt variant="smallStrong">Demo accounts</Txt>
          <Txt variant="small" color="secondary" style={{ marginTop: 4 }}>
            Seeded on the development server, password {DEMO_ACCOUNTS.password}.
          </Txt>
          <Button variant="secondary" compact label={`Patient · ${DEMO_ACCOUNTS.patient}`} style={{ marginTop: 12 }} disabled={busy} onPress={() => void submit(DEMO_ACCOUNTS.patient, DEMO_ACCOUNTS.password)} />
          <Button variant="secondary" compact label={`Dermatologist · ${DEMO_ACCOUNTS.doctor}`} style={{ marginTop: 8 }} disabled={busy} onPress={() => void submit(DEMO_ACCOUNTS.doctor, DEMO_ACCOUNTS.password)} />
        </Card>
      ) : null}
    </Screen>
  );
}

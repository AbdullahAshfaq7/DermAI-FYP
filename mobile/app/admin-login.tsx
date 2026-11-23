import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, ErrorBanner, Field, IconTile, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { errorMessage } from '@/lib/api';
import { resetTo } from '@/lib/nav';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Admin sign-in (from Welcome). Only admin accounts get through; anyone else is signed straight back out. */
export default function AdminLogIn() {
  const { colors } = useTheme();
  const { logIn, logOut } = useActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    email: !EMAIL.test(email.trim()) ? 'Enter your admin email.' : null,
    password: password.length === 0 ? 'Enter your password.' : null,
  };

  const submit = async (e = email, p = password) => {
    setTried(true);
    setError(null);
    if (e === email && (errors.email || errors.password)) return;
    setBusy(true);
    try {
      const s = await logIn(e.trim(), p);
      if (s.session?.role !== 'admin') {
        await logOut();
        setError("This isn't an admin account. Use the regular log in instead.");
        return;
      }
      resetTo('/admin');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<TopBar />} footer={<Button variant="ink" icon="admin-panel-settings" label="Log in to admin portal" loading={busy} onPress={() => void submit()} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconTile icon="admin-panel-settings" tone="muted" size={52} />
        <View style={{ flex: 1 }}>
          <Txt variant="display">Admin portal</Txt>
          <Txt variant="small" color="secondary">
            Manage accounts, doctor verification, bookings and cases.
          </Txt>
        </View>
      </View>
      <ErrorBanner error={error} />
      <Field label="Admin email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={tried ? errors.email : null} />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure={!show}
        autoCapitalize="none"
        error={tried ? errors.password : null}
        onSubmitEditing={() => void submit()}
        right={
          <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} hitSlop={10}>
            <Icon name={show ? 'visibility-off' : 'visibility'} size={20} color={colors.textMuted} />
          </Pressable>
        }
      />
      <Txt variant="small" color="secondary">
        Not staff?{' '}
        <Txt variant="smallStrong" color="brand" onPress={() => router.replace('/log-in')}>
          Regular log in
        </Txt>
      </Txt>
      {__DEV__ ? (
        <Card tone="muted">
          <Txt variant="smallStrong">Demo admin</Txt>
          <Txt variant="small" color="secondary" style={{ marginTop: 4 }}>
            Seeded on the development server.
          </Txt>
          <Button variant="secondary" compact label={`Admin · ${DEMO_ACCOUNTS.admin}`} style={{ marginTop: 12 }} disabled={busy} onPress={() => void submit(DEMO_ACCOUNTS.admin, DEMO_ACCOUNTS.adminPassword)} />
        </Card>
      ) : null}
    </Screen>
  );
}

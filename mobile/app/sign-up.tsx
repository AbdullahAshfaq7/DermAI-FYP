import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, ErrorBanner, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { errorMessage } from '@/lib/api';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A4 Create account */
export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useActions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? 'Enter your full name.' : null,
    email: !EMAIL.test(email.trim()) ? 'Enter an email like name@mail.com.' : null,
    password: password.length < 8 || !/\d/.test(password) ? 'At least 8 characters with one number.' : null,
  };
  const valid = !errors.name && !errors.email && !errors.password;

  const submit = async () => {
    setTried(true);
    setError(null);
    if (!valid) return;
    setBusy(true);
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/consent');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      header={<TopBar right={<Txt variant="small" color="secondary">2 of 3</Txt>} />}
      footer={
        <>
          <Button label="Create account" loading={busy} onPress={() => void submit()} />
          <Txt variant="small" color="secondary" align="center">
            Already have one?{' '}
            <Txt variant="smallStrong" color="brand" onPress={() => router.replace('/log-in')}>
              Log in
            </Txt>
          </Txt>
        </>
      }>
      <Txt variant="display">Create your account</Txt>
      <ErrorBanner error={error} />
      <Button variant="light" label="Continue with Google" icon="account-circle" onPress={() => Alert.alert('Google sign-in', 'Google sign-in is coming soon. Use your email for now.')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Txt variant="caption" color="muted">
          or with email
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={tried ? errors.name : null} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={tried ? errors.email : null} />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure={!show}
        autoCapitalize="none"
        error={tried ? errors.password : null}
        hint="At least 8 characters with one number."
        right={
          <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} hitSlop={10}>
            <Icon name={show ? 'visibility-off' : 'visibility'} size={20} color={colors.textMuted} />
          </Pressable>
        }
      />
      <Txt variant="caption" color="muted">
        By continuing you agree to the Terms and Privacy Policy.
      </Txt>
    </Screen>
  );
}

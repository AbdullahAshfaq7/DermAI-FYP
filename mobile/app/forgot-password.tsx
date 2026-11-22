import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Banner, Button, ErrorBanner, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { errorMessage } from '@/lib/api';
import { useActions } from '@/store/AppStore';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Reset a forgotten password with a 6-digit code. */
export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { forgotPassword, resetPassword } = useActions();
  const [email, setEmail] = useState(params.email ?? '');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const send = async () => {
    setTried(true);
    setError(null);
    if (!EMAIL.test(email.trim())) return;
    setBusy(true);
    try {
      const r = await forgotPassword(email.trim());
      setDevCode(r.devCode ?? null);
      setSent(true);
      setTried(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pwError = password.length < 8 || !/\d/.test(password) ? 'At least 8 characters with one number.' : null;
  const codeError = !/^\d{6}$/.test(code.trim()) ? 'Enter the 6-digit code.' : null;

  const reset = async () => {
    setTried(true);
    setError(null);
    if (pwError || codeError) return;
    setBusy(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      Alert.alert('Password changed', 'Log in with your new password.');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      header={<TopBar title="Reset password" />}
      footer={sent ? <Button label="Set new password" loading={busy} onPress={() => void reset()} /> : <Button label="Send code" loading={busy} onPress={() => void send()} />}>
      <Txt variant="display">{sent ? 'Check your email' : 'Forgot your password?'}</Txt>
      <Txt variant="body" color="secondary">
        {sent ? `If ${email.trim()} has an account, we've sent a 6-digit code. It works for 15 minutes.` : "Enter your account's email and we'll send you a code."}
      </Txt>
      <ErrorBanner error={error} />
      {!sent ? (
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={tried && !EMAIL.test(email.trim()) ? 'Enter a valid email.' : null} />
      ) : (
        <>
          {devCode ? <Banner icon="info" tone="watch" text={`Development server: email isn't connected yet, so your code is ${devCode}.`} /> : null}
          <Field label="6-digit code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" error={tried ? codeError : null} />
          <Field label="New password" value={password} onChangeText={setPassword} secure autoCapitalize="none" hint="At least 8 characters with one number." error={tried ? pwError : null} />
          <Txt variant="smallStrong" color="brand" onPress={() => void send()}>
            Send a new code
          </Txt>
        </>
      )}
    </Screen>
  );
}

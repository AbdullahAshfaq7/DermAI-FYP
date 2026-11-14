import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Field, Screen, TopBar, Txt } from '@/components/ui/kit';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A4 Create account */
export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useActions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);

  const errors = {
    name: name.trim().length < 2 ? 'Enter your full name.' : null,
    email: !EMAIL.test(email.trim()) ? 'Enter an email like name@mail.com.' : null,
    password: password.length < 8 || !/\d/.test(password) ? 'At least 8 characters with one number.' : null,
  };
  const valid = !errors.name && !errors.email && !errors.password;

  const submit = () => {
    setTried(true);
    if (!valid) return;
    signUp(name.trim(), email.trim().toLowerCase());
    router.push('/consent');
  };

  return (
    <Screen
      keyboard
      header={<TopBar right={<Txt variant="small" color="secondary">2 of 3</Txt>} />}
      footer={<Button label="Create account" onPress={submit} />}>
      <Txt variant="display">Create your account</Txt>
      <Button
        variant="secondary"
        label="Continue with Google"
        icon="account-circle"
        onPress={() => Alert.alert('Google sign-in', 'Google sign-in needs the auth service, which isn\'t connected yet. Use email for now.')}
      />
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
    </Screen>
  );
}

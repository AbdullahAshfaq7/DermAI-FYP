import { router } from 'expo-router';
import { useState } from 'react';

import { Button, ErrorBanner, Field, OptionCard, Screen, TopBar, Txt } from '@/components/ui/kit';
import { adminApi, type Role } from '@/lib/admin';
import { useSubmit } from '@/lib/useSubmit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Create an account for someone (a clinic's doctor, a new admin). */
export default function NewUser() {
  const [role, setRole] = useState<Role>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const { busy, error, run } = useSubmit();

  const errors = {
    name: name.trim().length < 2 ? 'Enter their full name.' : null,
    email: !EMAIL.test(email.trim()) ? 'Enter a valid email.' : null,
    password: password.length < 8 ? 'Use at least 8 characters.' : !/\d/.test(password) ? 'Add at least one number.' : null,
  };

  const submit = () => {
    setTried(true);
    if (errors.name || errors.email || errors.password) return;
    void run(async () => {
      const r = await adminApi.createUser({ role, name: name.trim(), email: email.trim(), password });
      router.replace({ pathname: '/admin/user/[id]', params: { id: r.id } });
    });
  };

  return (
    <Screen keyboard header={<TopBar title="New account" />} footer={<Button variant="ink" label="Create account" loading={busy} onPress={submit} />}>
      <ErrorBanner error={error} />
      <Txt variant="heading">Role</Txt>
      <OptionCard title="Patient" icon="face" selected={role === 'patient'} onPress={() => setRole('patient')} />
      <OptionCard title="Dermatologist" subtitle="They finish PMDC onboarding when they log in" icon="stethoscope" selected={role === 'dermatologist'} onPress={() => setRole('dermatologist')} />
      <OptionCard title="Admin" subtitle="Full access to this portal" icon="admin-panel-settings" selected={role === 'admin'} onPress={() => setRole('admin')} />
      <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={tried ? errors.name : null} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={tried ? errors.email : null} />
      <Field label="Temporary password" value={password} onChangeText={setPassword} secure autoCapitalize="none" error={tried ? errors.password : null} hint="Share it with them privately. They can change it in Settings." />
    </Screen>
  );
}

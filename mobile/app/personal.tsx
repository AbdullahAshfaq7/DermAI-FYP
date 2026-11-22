import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, ErrorBanner, Field, List, Row, Screen, Segmented, shadow, TopBar, Txt } from '@/components/ui/kit';
import { useTheme } from '@/theme/ThemeProvider';
import { back } from '@/lib/nav';
import { pickFromLibrary } from '@/lib/photos';
import { alertError, useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** F5 Personal information: age and gender help the routine, never shared without consent. */
export default function Personal() {
  const { colors } = useTheme();
  const state = useApp();
  const { updatePersonal, setAvatar } = useActions();
  const { busy, error: saveError, run } = useSubmit();
  const [uploading, setUploading] = useState(false);
  const p = state.profile;
  const [name, setName] = useState(state.session?.name ?? '');
  const [email, setEmail] = useState(state.session?.email ?? '');
  const [phone, setPhone] = useState(p.phone);
  const [dob, setDob] = useState(p.dob);
  const [gender, setGender] = useState(p.gender);
  const [city, setCity] = useState(p.city);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter an email like name@mail.com.');
    const r = await run(() => updatePersonal({ name: name.trim(), email: email.trim(), phone: phone.trim(), dob: dob.trim(), gender: gender.trim(), city: city.trim() }));
    if (r) back();
  };

  const changePhoto = async () => {
    const uri = await pickFromLibrary({ square: true });
    if (!uri) return;
    setUploading(true);
    try {
      await setAvatar(uri);
    } catch (e) {
      alertError(e, "Couldn't upload your photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen
      keyboard
      header={
        <TopBar
          title="Personal information"
          right={
            <Txt variant="smallStrong" color="brand" onPress={busy ? undefined : () => void save()} style={{ padding: space.sm }}>
              Save
            </Txt>
          }
        />
      }>
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Pressable onPress={uploading ? undefined : () => void changePhoto()} accessibilityRole="button" accessibilityLabel={state.session?.avatarUrl ? 'Change photo' : 'Add a photo'}>
          <Avatar name={name || 'You'} size={80} tone={p.tone ?? 2} uri={state.session?.avatarUrl} />
          <View style={[{ position: 'absolute', right: -4, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, shadow(colors)]}>
            <Icon name="edit" size={15} color={colors.textPrimary} />
          </View>
        </Pressable>
        {uploading ? (
          <Txt variant="caption" color="muted">
            Uploading…
          </Txt>
        ) : null}
      </View>
      <ErrorBanner error={saveError} />
      <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={error?.includes('name') ? error : null} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={error?.includes('email') ? error : null} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 1234567" />
      <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="3 March 2002" />
      <View style={{ gap: space.xs }}>
        <Txt variant="caption" color="muted">
          Gender
        </Txt>
        <Segmented
          value={(['Female', 'Male', 'Prefer not to say'].includes(gender) ? gender : 'Prefer not to say') as 'Female' | 'Male' | 'Prefer not to say'}
          onChange={setGender}
          options={[
            { value: 'Female', label: 'Female' },
            { value: 'Male', label: 'Male' },
            { value: 'Prefer not to say', label: 'Prefer not to say' },
          ]}
        />
      </View>
      <Field label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
      <Card tone="brand" style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Icon name="lock" size={18} color={colors.brandDeep} />
        <Txt variant="small" color="brandDeep" style={{ flex: 1 }}>
          Age and gender help tune your routine. We never share them without asking.
        </Txt>
      </Card>
      <List>
        <Row icon="lock" title="Change password" chevron onPress={() => router.push('/change-password')} />
      </List>
      <Button label="Save changes" loading={busy} onPress={() => void save()} />
    </Screen>
  );
}

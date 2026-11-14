import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Avatar, Button, Field, List, Row, Screen, TopBar, Txt } from '@/components/ui/kit';
import { back } from '@/lib/nav';
import { useStore } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** F5 Personal information: age and gender help the routine, never shared without consent. */
export default function Personal() {
  const { state, update } = useStore();
  const p = state.profile;
  const [name, setName] = useState(state.session?.name ?? '');
  const [email, setEmail] = useState(state.session?.email ?? '');
  const [phone, setPhone] = useState(p.phone);
  const [dob, setDob] = useState(p.dob);
  const [gender, setGender] = useState(p.gender);
  const [city, setCity] = useState(p.city);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter an email like name@mail.com.');
    update((s) => ({
      ...s,
      session: s.session ? { ...s.session, name: name.trim(), email: email.trim() } : s.session,
      profile: { ...s.profile, phone: phone.trim(), dob: dob.trim(), gender: gender.trim(), city: city.trim() },
    }));
    back();
  };

  return (
    <Screen
      keyboard
      header={
        <TopBar
          title="Personal information"
          right={
            <Txt variant="smallStrong" color="brand" onPress={save} style={{ padding: space.sm }}>
              Save
            </Txt>
          }
        />
      }>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Avatar name={name || 'You'} size={80} tone={p.tone ?? 2} />
        <Txt variant="smallStrong" color="brand" onPress={() => Alert.alert('Profile photo', 'Photo upload needs storage, which isn\'t connected yet.')}>
          Change photo
        </Txt>
      </View>
      <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={error?.includes('name') ? error : null} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={error?.includes('email') ? error : null} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 1234567" />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="14 Mar 2001" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Gender" value={gender} onChangeText={setGender} placeholder="Optional" />
        </View>
      </View>
      <Field label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
      <List>
        <Row icon="lock" title="Change password" subtitle="Needs the account service" chevron onPress={() => Alert.alert('Change password', 'Password changes need the account service, which isn\'t connected yet.')} />
      </List>
      <Button label="Save" onPress={save} />
    </Screen>
  );
}

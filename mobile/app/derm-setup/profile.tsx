import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Avatar, Button, Chip, Field, Screen, Txt } from '@/components/ui/kit';
import { useStore } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const SPECIALTIES = ['Acne', 'Pigmentation', 'Melasma', 'Rosacea', 'Eczema', 'Psoriasis', 'Hair and scalp', 'Scars', 'Moles and skin checks', 'Paediatric'];

/** G step 1: name, photo, specialties. */
export default function DermProfileStep() {
  const { state, update } = useStore();
  const [name, setName] = useState(state.session?.name ?? '');
  const [specialties, setSpecialties] = useState<string[]>(state.derm.specialties);
  const [photo, setPhoto] = useState(state.derm.photo);
  const toggle = (x: string) => setSpecialties((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]));

  const next = () => {
    update((s) => ({
      ...s,
      session: s.session ? { ...s.session, name: /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}` } : s.session,
      derm: { ...s.derm, specialties, photo, step: 'credentials' },
    }));
    router.push('/derm-setup/credentials');
  };

  return (
    <Screen
      header={<SetupHeader step={1} tone="clinician" label="Step 1 of 3" />}
      footer={<Button label="Next" variant="clinician" disabled={name.trim().length < 3 || specialties.length === 0} onPress={next} />}>
      <Txt variant="display">About you</Txt>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Avatar name={name || 'Dr'} size={84} clinician={!photo} tone={2} />
        <Txt
          variant="smallStrong"
          color="clinician"
          onPress={() => Alert.alert('Profile photo', 'Patients trust a real headshot. Photo upload needs storage, which isn\'t connected yet.', [{ text: 'OK', onPress: () => setPhoto(true) }])}>
          {photo ? 'Change photo' : 'Add a headshot'}
        </Txt>
      </View>
      <Field label="Name as on your PMDC licence" value={name} onChangeText={setName} autoCapitalize="words" />
      <Txt variant="heading">What do you treat?</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {SPECIALTIES.map((x) => (
          <Chip key={x} label={x} tone="clinician" selected={specialties.includes(x)} onPress={() => toggle(x)} />
        ))}
      </View>
    </Screen>
  );
}

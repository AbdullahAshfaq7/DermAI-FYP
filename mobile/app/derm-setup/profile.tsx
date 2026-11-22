import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Avatar, Button, Chip, ErrorBanner, Field, Screen, Txt } from '@/components/ui/kit';
import { pickFromLibrary } from '@/lib/photos';
import { alertError, useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Saraiki', 'Balochi'];
const SPECIALTIES = ['Acne', 'Pigmentation', 'Melasma', 'Rosacea', 'Eczema', 'Psoriasis', 'Hair and scalp', 'Scars', 'Moles and skin checks', 'Paediatric'];

/** G step 1: name, photo, specialties. */
export default function DermProfileStep() {
  const state = useApp();
  const { dermProfile, setAvatar } = useActions();
  const { busy, error, run } = useSubmit();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(state.session?.name ?? '');
  const [specialties, setSpecialties] = useState<string[]>(state.derm.specialties);
  const photoUrl = state.session?.avatarUrl;
  const [languages, setLanguages] = useState<string[]>(state.derm.languages?.length ? state.derm.languages : ['English', 'Urdu']);
  const toggle = (x: string) => setSpecialties((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]));
  const toggleLang = (x: string) => setLanguages((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]));

  const choosePhoto = async () => {
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

  const next = async () => {
    if (!(await run(() => dermProfile({ name: name.trim(), specialties, languages })))) return;
    router.push('/derm-setup/credentials');
  };

  return (
    <Screen
      header={<SetupHeader step={1} tone="clinician" />}
      footer={<Button label="Next" variant="clinician" disabled={name.trim().length < 3 || specialties.length === 0 || languages.length === 0} loading={busy} onPress={() => void next()} />}>
      <Txt variant="display">About you</Txt>
      <ErrorBanner error={error} />
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Avatar name={name || 'Dr'} size={84} clinician={!photoUrl} tone={2} uri={photoUrl} />
        <Txt variant="smallStrong" color="clinician" onPress={uploading ? undefined : () => void choosePhoto()}>
          {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Add a headshot'}
        </Txt>
      </View>
      <Field label="Name as on your PMDC licence" value={name} onChangeText={setName} autoCapitalize="words" />
      <Txt variant="heading">What do you treat?</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {SPECIALTIES.map((x) => (
          <Chip key={x} label={x} tone="clinician" selected={specialties.includes(x)} onPress={() => toggle(x)} />
        ))}
      </View>
      <Txt variant="heading">Languages you consult in</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {LANGUAGES.map((x) => (
          <Chip key={x} label={x} tone="clinician" selected={languages.includes(x)} onPress={() => toggleLang(x)} />
        ))}
      </View>
    </Screen>
  );
}

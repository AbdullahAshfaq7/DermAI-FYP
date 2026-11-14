import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Icon } from '@/components/ui/Icon';
import { Button, Field, Screen, Txt } from '@/components/ui/kit';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const PMDC = /^\d{4,6}-?[A-Z]$/i;

function Upload({ label, hint, value, onPress, tried }: { label: string; hint: string; value: string | null; onPress: () => void; tried: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value} uploaded. Tap to replace.` : `Upload ${label}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.lg,
        borderRadius: radius.card,
        borderWidth: 1,
        borderStyle: value ? 'solid' : 'dashed',
        borderColor: tried && !value ? colors.actIcon : value ? colors.border : colors.clinician,
        backgroundColor: value ? colors.surface : colors.clinicianWash,
      }}>
      <Icon name={value ? 'check-circle' : 'upload-file'} size={24} color={value ? colors.goodIcon : colors.clinician} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{value ?? label}</Txt>
        <Txt variant="small" color="secondary">
          {value ? 'uploaded' : hint}
        </Txt>
      </View>
    </Pressable>
  );
}

/** G1 Credentials: PMDC number, qualification, clinic, documents. */
export default function Credentials() {
  const { state, update } = useStore();
  const [pmdc, setPmdc] = useState(state.derm.pmdc);
  const [qual, setQual] = useState(state.derm.qualification);
  const [clinic, setClinic] = useState(state.derm.clinic);
  const [cert, setCert] = useState<string | null>(state.derm.certificate);
  const [cnic, setCnic] = useState<string | null>(state.derm.cnic);
  const [tried, setTried] = useState(false);

  const pick = async (set: (v: string) => void, fallback: string) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }).catch(() => null);
    if (res && !res.canceled && res.assets[0]) set(res.assets[0].fileName ?? fallback);
  };

  const valid = PMDC.test(pmdc.trim()) && qual.trim().length > 2 && clinic.trim().length > 2 && !!cert && !!cnic;

  const submit = () => {
    setTried(true);
    if (!valid) return;
    update((s) => ({ ...s, derm: { ...s.derm, pmdc: pmdc.trim().toUpperCase(), qualification: qual.trim(), clinic: clinic.trim(), certificate: cert, cnic, step: 'services' } }));
    router.push('/derm-setup/services');
  };

  return (
    <Screen
      keyboard
      header={<SetupHeader step={2} tone="clinician" label="Step 2 of 3" />}
      footer={<Button label="Submit for review" variant="clinician" onPress={submit} />}>
      <Txt variant="display">Verify your registration</Txt>
      <Field label="PMDC registration number" value={pmdc} onChangeText={setPmdc} autoCapitalize="none" placeholder="54123-P" error={tried && !PMDC.test(pmdc.trim()) ? 'Enter your PMDC number, like 54123-P.' : null} />
      <Field label="Qualification" value={qual} onChangeText={setQual} placeholder="FCPS Dermatology" error={tried && qual.trim().length <= 2 ? 'Add your highest qualification.' : null} />
      <Field label="Clinic or hospital" value={clinic} onChangeText={setClinic} placeholder="Skin Health Clinic, Gulberg III" error={tried && clinic.trim().length <= 2 ? 'Add where you practise.' : null} />
      <Upload label="PMDC certificate" hint="PDF or photo, under 10 MB" value={cert} tried={tried} onPress={() => pick(setCert, 'PMDC_certificate.jpg')} />
      <Upload label="CNIC, front" hint="Photo of the front of your CNIC" value={cnic} tried={tried} onPress={() => pick(setCnic, 'CNIC_front.jpg')} />
    </Screen>
  );
}

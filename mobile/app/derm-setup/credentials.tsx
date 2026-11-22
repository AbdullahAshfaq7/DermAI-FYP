import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';


import { SetupHeader } from '@/components/SetupHeader';
import { Icon } from '@/components/ui/Icon';
import { Banner, Button, ErrorBanner, Field, IconTile, List, Row, Screen, Txt } from '@/components/ui/kit';
import type { FilePart } from '@/lib/api';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';

const PMDC = /^\d{4,6}-?[A-Z]$/i;
const MAX_MB = 10;

/** "54123p" or "54123-p" -> "54123-P" */
const normalisePmdc = (v: string) => v.trim().toUpperCase().replace(/^(\d{4,6})-?([A-Z])$/, '$1-$2');

function DocRow({ label, hint, value, onPress, tried, optional }: { label: string; hint: string; value: string | null; onPress: () => void; tried: boolean; optional?: boolean }) {
  const { colors } = useTheme();
  const missing = tried && !value && !optional;
  return (
    <Row
      leading={<IconTile icon={value ? 'description' : 'upload-file'} tone={value ? 'clinician' : missing ? 'act' : 'muted'} size={36} />}
      title={value ?? label}
      subtitle={value ? `${label}, uploaded` : missing ? 'Required' : hint}
      label={value ? `${label}, ${value} uploaded. Tap to replace.` : `Upload ${label}`}
      onPress={onPress}
      right={value ? <Icon name="check-circle" size={22} color={colors.clinician} /> : null}
      action={value ? null : <Button label="Upload" variant="soft" compact onPress={onPress} />}
    />
  );
}

/** G1 Credentials: PMDC number, qualification, clinic, documents. */
export default function Credentials() {
  const state = useApp();
  const { dermCredentials } = useActions();
  const { busy, error, setError, run } = useSubmit();
  const [pmdc, setPmdc] = useState(state.derm.pmdc);
  const [qual, setQual] = useState(state.derm.qualification);
  const [clinic, setClinic] = useState(state.derm.clinic);
  // Files already on the server show by name; new picks carry a local uri to upload.
  const [since, setSince] = useState(state.derm.practisingSince ? String(state.derm.practisingSince) : '');
  const [cert, setCert] = useState<FilePart | null>(null);
  const [degree, setDegree] = useState<FilePart | null>(null);
  const [cnic, setCnic] = useState<FilePart | null>(null);
  const [tried, setTried] = useState(false);
  const certName = cert?.name ?? state.derm.certificate;
  const cnicName = cnic?.name ?? state.derm.cnic;
  const degreeName = degree?.name ?? state.derm.degree ?? null;
  const year = new Date().getFullYear();
  const sinceOk = !since.trim() || (/^\d{4}$/.test(since.trim()) && Number(since) >= 1960 && Number(since) <= year);

  const pick = async (set: (v: FilePart) => void, fallback: string) => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true }).catch(() => null);
    const a = res && !res.canceled ? res.assets[0] : null;
    if (!a) return;
    if (a.size && a.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB} MB. Choose a smaller one.`);
      return;
    }
    setError(null);
    set({ uri: a.uri, name: a.name ?? fallback, type: a.mimeType ?? (a.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') });
  };

  const valid = PMDC.test(pmdc.trim()) && qual.trim().length > 2 && clinic.trim().length > 2 && sinceOk && !!certName && !!degreeName;

  const submit = async () => {
    setTried(true);
    if (!valid) return;
    const r = await run(() => dermCredentials({ pmdc: normalisePmdc(pmdc), qualification: qual.trim(), clinic: clinic.trim(), since: since.trim(), certificate: cert, degree, cnic }));
    if (!r) return;
    if (r.state.derm.step === 'done') router.back();
    else router.push('/derm-setup/services');
  };

  return (
    <Screen
      keyboard
      header={<SetupHeader step={2} tone="clinician" editing={state.derm.step === 'done'} />}
      footer={<Button label={state.derm.step === 'done' ? 'Save and resubmit' : 'Continue'} variant="clinician" loading={busy} onPress={() => void submit()} />}>
      <Txt variant="display">Verify your registration</Txt>
      {state.derm.status === 'rejected' ? <Banner tone="act" icon="error-outline" text={state.derm.reviewNote ? `We couldn't verify you: ${state.derm.reviewNote}` : "We couldn't verify you. Check your PMDC number and documents."} /> : null}
      <ErrorBanner error={error} />
      <Field label="PMDC registration number" value={pmdc} onChangeText={setPmdc} autoCapitalize="none" placeholder="54123-P" error={tried && !PMDC.test(pmdc.trim()) ? 'Enter your PMDC number, like 54123-P.' : null} />
      <Field label="Highest qualification" value={qual} onChangeText={setQual} placeholder="FCPS Dermatology" error={tried && qual.trim().length <= 2 ? 'Add your highest qualification.' : null} />
      <Field label="Clinic or hospital" value={clinic} onChangeText={setClinic} placeholder="Skin Health Clinic, Gulberg III" error={tried && clinic.trim().length <= 2 ? 'Add where you practise.' : null} />
      <Field
        label="Practising since"
        value={since}
        onChangeText={(v) => setSince(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        placeholder="2015"
        error={tried && !sinceOk ? `Enter a year between 1960 and ${year}.` : null}
      />
      <Txt variant="heading">Documents</Txt>
      <List>
        <DocRow label="PMDC certificate" hint="PDF or photo, under 10 MB" value={certName} tried={tried} onPress={() => void pick(setCert, 'PMDC_certificate.pdf')} />
        <DocRow label="Degree certificate" hint="PDF or photo" value={degreeName} tried={tried} onPress={() => void pick(setDegree, 'Degree_certificate.pdf')} />
        <DocRow label="CNIC, front" hint="Optional, speeds up the check" value={cnicName} tried={tried} optional onPress={() => void pick(setCnic, 'CNIC_front.jpg')} />
      </List>
      <Txt variant="caption" color="muted">
        We check every number with PMDC before you see patients. Usually 1 to 2 working days. Documents are private to our verification team.
      </Txt>
    </Screen>
  );
}

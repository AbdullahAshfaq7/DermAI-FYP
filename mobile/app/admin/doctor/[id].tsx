import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { confirm, dermTone, KV, Loader, Section, usePrompt } from '@/components/admin';
import { Avatar, Banner, Button, Chip, ErrorBanner, Field, List, Row, Screen, StatusPill, ToggleRow, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { adminApi, dateTime, DERM_STATUS_LABEL, useAdminQuery, type DermDetail, type Service } from '@/lib/admin';
import { pkr } from '@/lib/format';
import { useSubmit } from '@/lib/useSubmit';
import { space } from '@/theme/tokens';

const SPECIALTIES = ['Acne', 'Pigmentation', 'Melasma', 'Rosacea', 'Eczema', 'Psoriasis', 'Hair and scalp', 'Scars', 'Moles and skin checks', 'Paediatric', 'Redness', 'Sensitivity'];
const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Saraiki', 'Balochi'];
const SERVICES: Service[] = ['video', 'clinic', 'message'];

/** One dermatologist: PMDC documents, verification, and every profile field. */
export default function AdminDoctor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: d, error, loading, reload } = useAdminQuery(() => adminApi.derm(id), [id]);
  const [prompt, ask] = usePrompt();
  const act = useSubmit();
  const [notice, setNotice] = useState<string | null>(null);

  const approve = () =>
    act.run(async () => {
      await adminApi.approve(id);
      await reload();
      setNotice('Verified. Patients can now find and book this doctor.');
    });

  const sendBack = (revoke: boolean) =>
    ask({
      title: revoke ? 'Revoke verification?' : 'Send back for changes?',
      message: revoke
        ? 'They leave the directory and their upcoming visits are cancelled. The doctor sees your note.'
        : 'The doctor sees your note and can fix their details and documents.',
      label: 'Note to the doctor',
      action: revoke ? 'Revoke' : 'Send back',
      destructive: true,
      required: true,
      onSubmit: async (note) => {
        await adminApi.reject(id, note);
        await reload();
        setNotice(revoke ? 'Verification revoked.' : 'Sent back to the doctor.');
      },
    });

  return (
    <Screen keyboard header={<TopBar title="Doctor" />}>
      {prompt}
      <Loader loading={loading} error={error} onRetry={() => void reload()}>
        {d ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={d.name} size={60} clinician />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="title">{d.name}</Txt>
                <Txt variant="small" color="secondary">
                  {d.email}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <StatusPill label={DERM_STATUS_LABEL[d.status]} tone={dermTone(d.status)} />
                  {d.suspended ? <StatusPill label="Account suspended" tone="act" icon="block" /> : null}
                </View>
              </View>
            </View>
            {notice ? <Banner icon="check-circle" tone="clinician" text={notice} /> : null}
            {d.reviewNote && d.status === 'rejected' ? <Banner icon="error-outline" tone="act" text={`Last note: ${d.reviewNote}`} /> : null}
            <ErrorBanner error={act.error} />

            <Section title="Verification">
              <KV label="PMDC number" value={d.pmdc} />
              <KV label="Qualification" value={d.qualification} />
              <KV label="Onboarding step" value={d.step} />
              <KV label="Submitted" value={dateTime(d.submittedAt)} />
              <KV label="Verified" value={dateTime(d.approvedAt)} />
              <View style={{ gap: space.sm, marginTop: space.sm }}>
                <DocButton label="PMDC certificate" name={d.certificateName} url={d.certificate} />
                <DocButton label="Degree certificate" name={d.degreeName} url={d.degree} />
                <DocButton label="CNIC" name={d.cnicName} url={d.cnic} />
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                {d.status !== 'approved' ? (
                  <Button
                    variant="clinician"
                    icon="verified"
                    label="Verify"
                    loading={act.busy}
                    disabled={d.step !== 'done' || !d.certificate || !d.degree}
                    style={{ flex: 1 }}
                    onPress={() => confirm('Verify this doctor?', `Check PMDC ${d.pmdc} on the PMDC register before you verify.`, 'Verify', () => void approve(), false)}
                  />
                ) : null}
                {d.status === 'pending' || d.status === 'approved' ? (
                  <Button variant="destructive" label={d.status === 'approved' ? 'Revoke' : 'Send back'} style={{ flex: 1 }} onPress={() => sendBack(d.status === 'approved')} />
                ) : null}
              </View>
              {d.status !== 'approved' && (d.step !== 'done' || !d.certificate || !d.degree) ? (
                <Txt variant="small" color="secondary" style={{ marginTop: space.sm }}>
                  This doctor can be verified once they finish onboarding and upload both certificates.
                </Txt>
              ) : null}
            </Section>

            <Section title="Numbers">
              <KV label="Bookings" value={d.stats.appointments} />
              <KV label="Upcoming" value={d.stats.upcoming} />
              <KV label="Cases" value={d.stats.cases} />
              <KV label="Earned (completed visits)" value={pkr(d.stats.earned)} />
              <KV label="Rating" value={d.reviews ? `${d.rating} from ${d.reviews} reviews` : 'No reviews yet'} />
              <KV label="Years in practice" value={d.years} />
            </Section>

            <EditDoctor key={JSON.stringify(d)} d={d} onSaved={async () => { await reload(); setNotice('Profile saved.'); }} />

            <List>
              <Row icon="person" title="Open account" subtitle="Password, suspension, delete" chevron onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: d.userId } })} />
            </List>
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}

function DocButton({ label, name, url }: { label: string; name: string | null; url: string | null }) {
  if (!url) return <Row icon="description" iconTone="muted" title={label} subtitle="Not uploaded" muted />;
  return <Row icon="description" iconTone="clinician" title={label} subtitle={name ?? 'Open file'} chevron onPress={() => void Linking.openURL(url)} />;
}

function EditDoctor({ d, onSaved }: { d: DermDetail; onSaved: () => Promise<void> }) {
  const init = () => ({
    qualification: d.qualification,
    clinic: d.clinic,
    city: d.city,
    bio: d.bio,
    focus: d.focus,
    since: d.practisingSince ? String(d.practisingSince) : '',
    specialties: d.specialties,
    languages: d.languages,
    female: d.female,
    services: d.services,
    fees: Object.fromEntries(SERVICES.map((k) => [k, String(d.services[k]?.fee ?? 0)])) as Record<Service, string>,
  });
  const [f, setF] = useState(init);
  const save = useSubmit();
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = () =>
    save.run(async () => {
      const since = f.since.trim();
      if (since && !/^\d{4}$/.test(since)) throw new Error('Enter the year they started practising, like 2015.');
      const services = Object.fromEntries(SERVICES.map((k) => [k, { on: f.services[k].on, fee: Number(f.fees[k]) || 0 }])) as DermDetail['services'];
      await adminApi.updateDerm(d.id, {
        qualification: f.qualification.trim(),
        clinic: f.clinic.trim(),
        city: f.city.trim(),
        bio: f.bio.trim(),
        focus: f.focus.trim(),
        practisingSince: since ? Number(since) : null,
        specialties: f.specialties,
        languages: f.languages,
        female: f.female,
        services,
      });
      await onSaved();
    });

  return (
    <Section title="Profile">
      <View style={{ gap: space.sm }}>
        <ErrorBanner error={save.error} />
        <Field label="Qualification" value={f.qualification} onChangeText={(v) => setF((x) => ({ ...x, qualification: v }))} />
        <Field label="Clinic" value={f.clinic} onChangeText={(v) => setF((x) => ({ ...x, clinic: v }))} />
        <Field label="City" value={f.city} onChangeText={(v) => setF((x) => ({ ...x, city: v }))} autoCapitalize="words" />
        <Field label="Practising since (year)" value={f.since} onChangeText={(v) => setF((x) => ({ ...x, since: v }))} keyboardType="number-pad" />
        <Field label="Focus" value={f.focus} onChangeText={(v) => setF((x) => ({ ...x, focus: v }))} />
        <Field label="Bio" value={f.bio} onChangeText={(v) => setF((x) => ({ ...x, bio: v }))} multiline />
        <Txt variant="caption" color="secondary">
          Treats
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {SPECIALTIES.map((s) => (
            <Chip key={s} tone="clinician" label={s} selected={f.specialties.includes(s)} onPress={() => setF((x) => ({ ...x, specialties: toggle(x.specialties, s) }))} />
          ))}
        </View>
        <Txt variant="caption" color="secondary">
          Languages
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {LANGUAGES.map((s) => (
            <Chip key={s} tone="clinician" label={s} selected={f.languages.includes(s)} onPress={() => setF((x) => ({ ...x, languages: toggle(x.languages, s) }))} />
          ))}
        </View>
        <Txt variant="caption" color="secondary">
          Shown to patients as
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Female doctor" selected={f.female === true} onPress={() => setF((x) => ({ ...x, female: x.female === true ? null : true }))} />
          <Chip label="Male doctor" selected={f.female === false} onPress={() => setF((x) => ({ ...x, female: x.female === false ? null : false }))} />
        </View>
        <Txt variant="caption" color="secondary">
          Services and fees (PKR 500 to 50,000)
        </Txt>
        {SERVICES.map((k) => (
          <View key={k} style={{ gap: space.xs }}>
            <ToggleRow title={SERVICE_META[k].title} value={f.services[k].on} onChange={(on) => setF((x) => ({ ...x, services: { ...x.services, [k]: { ...x.services[k], on } } }))} />
            {f.services[k].on ? <Field label={`${SERVICE_META[k].short} fee`} value={f.fees[k]} keyboardType="number-pad" onChangeText={(v) => setF((x) => ({ ...x, fees: { ...x.fees, [k]: v.replace(/\D/g, '') } }))} /> : null}
          </View>
        ))}
        <Button variant="ink" label="Save profile" loading={save.busy} onPress={() => void submit()} style={{ marginTop: space.xs }} />
      </View>
    </Section>
  );
}

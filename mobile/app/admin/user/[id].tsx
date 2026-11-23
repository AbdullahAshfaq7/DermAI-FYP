import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { apptTone, cap, caseTone, confirm, KV, Loader, Section, usePrompt } from '@/components/admin';
import { Avatar, Banner, Button, Chip, ErrorBanner, Field, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { adminApi, dateTime, DERM_STATUS_LABEL, ROLE_LABEL, useAdminQuery, type UserDetail } from '@/lib/admin';
import { back } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const GENDERS = ['Female', 'Male', 'Prefer not to say'];

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.map(show).join(', ') : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/** One account: every field, everything they've done, and the admin actions on it. */
export default function AdminUser() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useApp().session;
  const { data: u, error, loading, reload } = useAdminQuery(() => adminApi.user(id), [id]);
  const [prompt, ask] = usePrompt();
  const act = useSubmit();
  const [notice, setNotice] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>, done?: string) =>
    act.run(async () => {
      await fn();
      await reload();
      if (done) setNotice(done);
    });
  const self = u?.id === me?.id;

  return (
    <Screen keyboard header={<TopBar title={u?.name ?? 'Account'} />}>
      {prompt}
      <Loader loading={loading} error={error} onRetry={() => void reload()}>
        {u ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={u.name} uri={u.avatarUrl} size={60} clinician={u.role === 'dermatologist'} />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="title">{u.name}</Txt>
                <Txt variant="small" color="secondary">
                  {u.email}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <StatusPill label={ROLE_LABEL[u.role]} tone={u.role === 'admin' ? 'butter' : u.role === 'dermatologist' ? 'clinician' : 'brand'} />
                  {u.suspended ? <StatusPill label="Suspended" tone="act" icon="block" /> : <StatusPill label="Active" tone="good" />}
                  {self ? <StatusPill label="You" /> : null}
                </View>
              </View>
            </View>
            {u.suspended ? <Banner icon="block" tone="act" text={`Suspended${u.suspendedReason ? `: ${u.suspendedReason}` : ''}. They can't sign in.`} /> : null}
            {notice ? <Banner icon="check-circle" tone="clinician" text={notice} /> : null}
            <ErrorBanner error={act.error} />

            <EditAccount key={[u.id, u.name, u.email, u.profile.phone, u.profile.dob, u.profile.gender, u.city].join('|')} u={u} onSaved={async () => { await reload(); setNotice('Changes saved.'); }} />

            <Section title="Account">
              <KV label="Account id" value={u.id} />
              <KV label="Joined" value={dateTime(u.createdAt)} />
              <KV label="Last log in" value={dateTime(u.lastLoginAt)} />
              <KV label="Signed-in devices" value={u.activeSessions} />
              <KV label="Demo account" value={show(u.demo)} />
              <KV label="Consent (18+)" value={show(u.consent?.adult)} />
              <KV label="Consent given" value={dateTime(u.consent?.at)} />
              <KV label="AI training opt-in" value={show(u.consent?.train ?? u.settings.train)} />
            </Section>

            {u.role === 'patient' ? (
              <>
                <Section title="Skin profile">
                  <KV label="Skin tone (Fitzpatrick)" value={typeof u.profile.tone === 'number' ? `Type ${u.profile.tone + 1}` : '—'} />
                  <KV label="Skin feels" value={show(u.profile.feel)} />
                  <KV label="Concerns" value={show(u.profile.concerns)} />
                  <KV label="Other concerns" value={show(u.profile.otherConcerns)} />
                  <KV label="Avoids" value={show(u.profile.avoid)} />
                  <KV label="Current products" value={show(u.profile.currentProducts)} />
                  <KV label="Setup finished" value={show(u.profile.done)} />
                </Section>
                <Section title="Activity">
                  <KV label="Scans" value={u.counts.scans} />
                  <KV label="Saved items" value={u.counts.saved} />
                  <KV label="Ask DermAI messages" value={u.counts.aiMessages} />
                  <KV label="Notifications" value={u.counts.notifications} />
                </Section>
                <Section title="Settings">
                  {Object.entries(u.settings).map(([k, v]) => (
                    <KV key={k} label={k} value={show(v)} />
                  ))}
                </Section>
                <Section title="Routine">
                  {Object.entries(u.routinePrefs).map(([k, v]) => (
                    <KV key={k} label={k} value={show(v)} />
                  ))}
                </Section>
              </>
            ) : null}

            {u.derm ? (
              <Section title="Doctor profile" right={<StatusPill label={DERM_STATUS_LABEL[u.derm.status]} tone={u.derm.status === 'approved' ? 'good' : 'watch'} />}>
                <KV label="PMDC" value={u.derm.pmdc} />
                <KV label="Clinic" value={u.derm.clinic} />
                <KV label="Rating" value={u.derm.reviews ? `${u.derm.rating} (${u.derm.reviews})` : '—'} />
                <Button variant="soft" compact label="Open doctor profile" style={{ marginTop: space.sm }} onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: u.derm!.id } })} />
              </Section>
            ) : null}

            {u.scans.length ? (
              <>
                <Txt variant="heading">Scans</Txt>
                <List>
                  {u.scans.map((s) => (
                    <Row
                      key={s.id}
                      icon="camera-alt"
                      iconTone="muted"
                      title={`Score ${s.score}`}
                      subtitle={`${dateTime(s.date)} · ${cap(s.quality)} quality · ${s.confidence}% confident`}
                      action={
                        <Chip
                          label="Delete"
                          onPress={() => confirm('Delete this scan?', 'Its scores are removed for the patient and any doctor it was shared with.', 'Delete', () => void run(() => adminApi.deleteScan(s.id), 'Scan deleted.'))}
                        />
                      }
                    />
                  ))}
                </List>
              </>
            ) : null}

            {u.appointments.length ? (
              <>
                <Txt variant="heading">Bookings</Txt>
                <List>
                  {u.appointments.map((a) => (
                    <Row
                      key={a.id}
                      icon={SERVICE_META[a.service].icon}
                      title={u.role === 'patient' ? a.doctorName : a.patientName}
                      subtitle={`${SERVICE_META[a.service].short} · ${dateTime(a.start)}`}
                      right={<StatusPill label={cap(a.status)} tone={apptTone(a.status)} />}
                      chevron
                      onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: a.id } })}
                    />
                  ))}
                </List>
              </>
            ) : null}

            {u.cases.length ? (
              <>
                <Txt variant="heading">Cases</Txt>
                <List>
                  {u.cases.map((c) => (
                    <Row
                      key={c.id}
                      icon="folder-open"
                      title={`${c.number ?? 'Case'} · ${u.role === 'patient' ? c.doctorName : c.patientName}`}
                      subtitle={c.summary || c.complaint}
                      right={<StatusPill label={cap(c.status)} tone={caseTone(c.status)} />}
                      chevron
                      onPress={() => router.push({ pathname: '/admin/case/[id]', params: { id: c.id } })}
                    />
                  ))}
                </List>
              </>
            ) : null}

            <Txt variant="heading">Admin actions</Txt>
            <List>
              <Row
                icon="key"
                title="Set a new password"
                subtitle="Signs them out of every device"
                chevron
                onPress={() =>
                  ask({
                    title: 'Set a new password',
                    message: `Tell ${u.name} the new password through a channel you trust.`,
                    label: 'New password (8+ characters with a number)',
                    action: 'Set password',
                    secure: true,
                    required: true,
                    onSubmit: async (pw) => {
                      await adminApi.setPassword(u.id, pw);
                      await reload();
                      setNotice('Password changed. They have been signed out.');
                    },
                  })
                }
              />
              {!self ? (
                <Row
                  icon="devices"
                  title="Sign out everywhere"
                  subtitle={`${u.activeSessions} signed-in device${u.activeSessions === 1 ? '' : 's'}`}
                  chevron
                  onPress={() => confirm('Sign out everywhere?', `${u.name} will need to log in again on every device.`, 'Sign out', () => void run(() => adminApi.signOutUser(u.id), 'Signed out of every device.'), false)}
                />
              ) : null}
              {!self && u.suspended ? (
                <Row icon="lock-open" iconTone="good" title="Restore account" subtitle="They can sign in again" chevron onPress={() => void run(() => adminApi.restore(u.id), 'Account restored.')} />
              ) : null}
              {!self && !u.suspended ? (
                <Row
                  icon="block"
                  iconTone="watch"
                  title="Suspend account"
                  subtitle={u.role === 'dermatologist' ? 'Signs them out and cancels their upcoming visits' : 'Signs them out and blocks log in'}
                  chevron
                  onPress={() =>
                    ask({
                      title: `Suspend ${u.name}?`,
                      message: u.role === 'dermatologist' ? 'Their upcoming visits are cancelled and patients are told. You can restore the account later.' : 'You can restore the account later.',
                      label: 'Reason (kept in the audit log)',
                      action: 'Suspend',
                      destructive: true,
                      onSubmit: async (reason) => {
                        await adminApi.suspend(u.id, reason);
                        await reload();
                        setNotice('Account suspended.');
                      },
                    })
                  }
                />
              ) : null}
              {!self ? (
                <Row
                  icon="delete-forever"
                  destructive
                  title="Delete account"
                  subtitle="Removes the account and all of its data"
                  onPress={() =>
                    confirm(`Delete ${u.name}?`, 'This removes their account, scans, bookings, messages and files. It cannot be undone.', 'Delete', () =>
                      void act.run(async () => {
                        await adminApi.deleteUser(u.id);
                        back('/admin/users');
                      }),
                    )
                  }
                />
              ) : null}
            </List>
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}

function EditAccount({ u, onSaved }: { u: UserDetail; onSaved: () => Promise<void> }) {
  const initial = {
    name: u.name.replace(/^Dr\.?\s+/i, ''),
    email: u.email,
    phone: String(u.profile.phone ?? ''),
    dob: String(u.profile.dob ?? ''),
    gender: String(u.profile.gender ?? ''),
    city: u.city ?? '',
  };
  const [f, setF] = useState(initial);
  const save = useSubmit();
  const changed = (Object.keys(f) as (keyof typeof f)[]).filter((k) => f[k].trim() !== initial[k]);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Section title="Details">
      <View style={{ gap: space.sm }}>
        <ErrorBanner error={save.error} />
        <Field label={u.role === 'dermatologist' ? 'Name (Dr. is added)' : 'Full name'} value={f.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+92 300 1234567" />
        {u.role === 'patient' ? <Field label="Date of birth" value={f.dob} onChangeText={set('dob')} placeholder="14 Mar 2001" /> : null}
        <Field label="City" value={f.city} onChangeText={set('city')} autoCapitalize="words" />
        <Txt variant="caption" color="secondary">
          Gender
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {GENDERS.map((g) => (
            <Chip key={g} label={g} selected={f.gender === g} onPress={() => setF((x) => ({ ...x, gender: x.gender === g ? '' : g }))} />
          ))}
        </View>
        <Button
          variant="ink"
          label={changed.length ? 'Save changes' : 'No changes'}
          disabled={!changed.length}
          loading={save.busy}
          style={{ marginTop: space.xs }}
          onPress={() =>
            void save.run(async () => {
              const body = Object.fromEntries(changed.map((k) => [k, f[k].trim()]));
              await adminApi.updateUser(u.id, body);
              await onSaved();
            })
          }
        />
      </View>
    </Section>
  );
}

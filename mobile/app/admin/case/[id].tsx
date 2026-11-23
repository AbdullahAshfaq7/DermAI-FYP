import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { cap, caseTone, KV, Loader, Section, urgencyTone } from '@/components/admin';
import { Banner, Card, Chip, ErrorBanner, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { adminApi, dateTime, useAdminQuery, type CaseStatus } from '@/lib/admin';
import { useSubmit } from '@/lib/useSubmit';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** One case with its conversation. Opening it is recorded in the audit log. */
export default function AdminCase() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: c, error, loading, reload } = useAdminQuery(() => adminApi.case(id), [id]);
  const act = useSubmit();
  const [notice, setNotice] = useState<string | null>(null);

  const setStatus = (status: CaseStatus) =>
    act.run(async () => {
      await adminApi.setCaseStatus(id, status);
      await reload();
      setNotice(`Case marked ${status}.`);
    });

  return (
    <Screen header={<TopBar title={c?.number ?? 'Case'} />}>
      <Loader loading={loading} error={error} onRetry={() => void reload()}>
        {c ? (
          <>
            <Txt variant="title">{c.summary || c.complaint || 'Case'}</Txt>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <StatusPill label={cap(c.status)} tone={caseTone(c.status)} />
              <StatusPill label={cap(c.urgency)} tone={urgencyTone(c.urgency)} />
              {c.flags.map((f) => (
                <StatusPill key={f} label={f} tone="watch" icon="flag" />
              ))}
            </View>
            <Banner icon="visibility" tone="butter" text="Private medical conversation. Your viewing is recorded in the audit log." />
            {notice ? <Banner icon="check-circle" tone="clinician" text={notice} /> : null}
            <ErrorBanner error={act.error} />
            <Section title="Details">
              <KV label="Case id" value={c.id} />
              <KV label="Received" value={dateTime(c.receivedAt)} />
              <KV label="Channel" value={cap(c.channel)} />
              <KV label="Complaint" value={c.complaint} />
              <KV label="Photos" value={c.photos} />
              <KV label="Assessment sent" value={c.assessment?.sentAt ? dateTime(c.assessment.sentAt) : 'Not yet'} />
              {c.assessment?.findings?.length ? <KV label="Findings" value={c.assessment.findings.join(', ')} /> : null}
            </Section>
            {c.assessment?.note ? (
              <Card tone="clinician">
                <Txt variant="smallStrong">Doctor&apos;s note</Txt>
                <Txt variant="small" style={{ marginTop: 4 }}>
                  {c.assessment.note}
                </Txt>
              </Card>
            ) : null}
            <List>
              <Row icon="face" title={c.patientName} subtitle="Patient" chevron onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: c.patientId } })} />
              <Row icon="stethoscope" iconTone="clinician" title={c.doctorName} subtitle="Doctor" chevron onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: c.doctorId } })} />
            </List>
            <Section title="Status">
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {(['waiting', 'replied', 'closed'] as CaseStatus[]).map((s) => (
                  <Chip key={s} label={cap(s)} selected={c.status === s} onPress={() => c.status !== s && void setStatus(s)} />
                ))}
              </View>
            </Section>
            <Txt variant="heading">Messages ({c.messages.length})</Txt>
            {c.messages.length ? (
              c.messages.map((m) => (
                <View
                  key={m.id}
                  style={{
                    alignSelf: m.from === 'doctor' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: m.from === 'doctor' ? colors.clinicianWash : colors.surface,
                    borderRadius: radius.card,
                    padding: space.md,
                    gap: 4,
                  }}>
                  <Txt variant="caption" color="secondary">
                    {m.from === 'doctor' ? c.doctorName : c.patientName} · {dateTime(m.at)}
                  </Txt>
                  <Txt variant="small">{m.text || (m.hasPhoto ? 'Sent a photo' : '—')}</Txt>
                  {m.hasPhoto || m.hasNote ? (
                    <Txt variant="caption" color="muted">
                      {[m.hasPhoto && 'Photo attached', m.hasNote && 'Assessment attached'].filter(Boolean).join(' · ')}
                    </Txt>
                  ) : null}
                </View>
              ))
            ) : (
              <Txt variant="small" color="secondary">
                No messages in this case yet.
              </Txt>
            )}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}

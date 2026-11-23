import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { apptTone, cap, KV, Loader, payTone, Section, usePrompt } from '@/components/admin';
import { Banner, Button, ErrorBanner, IconTile, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { adminApi, dateTime, useAdminQuery, type PaymentStatus } from '@/lib/admin';
import { pkr } from '@/lib/format';
import { useSubmit } from '@/lib/useSubmit';
import { space } from '@/theme/tokens';

/** One booking: everything about it, plus cancel and payment status. */
export default function AdminBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: a, error, loading, reload } = useAdminQuery(() => adminApi.appointment(id), [id]);
  const [prompt, ask] = usePrompt();
  const act = useSubmit();
  const [notice, setNotice] = useState<string | null>(null);

  const pay = (status: PaymentStatus, msg: string) =>
    act.run(async () => {
      await adminApi.setPayment(id, status);
      await reload();
      setNotice(msg);
    });

  return (
    <Screen header={<TopBar title="Booking" />}>
      {prompt}
      <Loader loading={loading} error={error} onRetry={() => void reload()}>
        {a ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <IconTile icon={SERVICE_META[a.service].icon} size={52} />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="title">{SERVICE_META[a.service].title}</Txt>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <StatusPill label={cap(a.status)} tone={apptTone(a.status)} />
                  <StatusPill label={cap(a.paymentStatus)} tone={payTone(a.paymentStatus)} />
                </View>
              </View>
            </View>
            {notice ? <Banner icon="check-circle" tone="clinician" text={notice} /> : null}
            <ErrorBanner error={act.error} />
            <Section title="Details">
              <KV label="Booking id" value={a.id} />
              <KV label={a.service === 'message' ? 'Sent' : 'When'} value={dateTime(a.service === 'message' ? a.createdAt : a.start)} />
              {a.service !== 'message' ? <KV label="Length" value={`${a.minutes} min`} /> : null}
              <KV label="Reason" value={a.reason} />
              <KV label="Scans shared" value={a.sharedScans} />
              <KV label="Fee" value={pkr(a.fee)} />
              <KV label="Payment method" value={a.paymentMethod.replace(/_/g, ' ')} />
              <KV label="Booked" value={dateTime(a.createdAt)} />
              {a.cancelledBy ? <KV label="Cancelled by" value={a.cancelledBy === 'admin' ? 'DermAI support' : cap(a.cancelledBy)} /> : null}
              {a.rating ? <KV label="Patient rating" value={`${a.rating} / 5`} /> : null}
            </Section>
            <List>
              <Row icon="face" title={a.patientName} subtitle="Patient" chevron onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: a.patientId } })} />
              <Row icon="stethoscope" iconTone="clinician" title={a.doctorName} subtitle="Doctor" chevron onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: a.doctorId } })} />
              {a.caseId ? <Row icon="folder-open" title="Open case" chevron onPress={() => router.push({ pathname: '/admin/case/[id]', params: { id: a.caseId! } })} /> : null}
            </List>

            <Section title="Payment">
              <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                {a.paymentStatus !== 'paid' && a.paymentStatus !== 'refunded' ? <Button compact variant="clinician" label="Mark paid" loading={act.busy} onPress={() => void pay('paid', 'Marked as paid.')} /> : null}
                {a.paymentStatus === 'paid' ? <Button compact variant="secondary" label="Refund" loading={act.busy} onPress={() => void pay('refunded', 'Marked as refunded.')} /> : null}
                {a.paymentStatus !== 'due' ? <Button compact variant="ghost" label="Set back to due" onPress={() => void pay('due', 'Set back to due.')} /> : null}
              </View>
            </Section>

            {a.status === 'upcoming' ? (
              <Button
                variant="destructive"
                icon="event-busy"
                label="Cancel booking"
                onPress={() =>
                  ask({
                    title: 'Cancel this booking?',
                    message: 'The patient and doctor are both notified. A paid booking is marked refunded. Unlike patients, support can cancel at any time.',
                    label: 'Message to the patient (optional)',
                    action: 'Cancel booking',
                    destructive: true,
                    onSubmit: async (note) => {
                      await adminApi.cancelAppointment(id, note);
                      await reload();
                      setNotice('Booking cancelled.');
                    },
                  })
                }
              />
            ) : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}

import * as Calendar from 'expo-calendar/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, EmptyState, LoadingState, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { dayMonth, drShort, longWeekday, time, weekdayDayMonth } from '@/lib/format';
import { doctorById } from '@/lib/selectors';
import { alertError, attempt } from '@/lib/useSubmit';
import { useActions, useApp, useRefreshIfMissing } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

function close() {
  if (router.canDismiss()) router.dismiss();
  else router.replace('/home');
}

/** E6 Booking confirmed: shows on Home (D1) and Care (E1). */
export default function Booked() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { cancelAppointment, rateAppointment } = useActions();
  const [now] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const appt = s.appointments.find((a) => a.id === id);
  const checking = useRefreshIfMissing(!appt);
  const listed = doctorById(s, appt?.doctorId);
  const d = listed ?? { name: 'Your doctor', clinic: '' };
  const thread = s.threads.find((t) => t.doctorId === appt?.doctorId);

  if (!appt) {
    return (
      <Screen edges={[]} header={<TopBar left="close" onLeft={close} />}>
        {checking ? <LoadingState label="Loading booking" /> : <EmptyState icon="event-busy" title="Booking not found" body="It may have been cancelled." />}
      </Screen>
    );
  }

  const isMessage = appt.service === 'message';
  const cancelBy = new Date(new Date(appt.start).getTime() - 2 * 3600000);
  const canCancel = appt.status === 'upcoming' && !isMessage && now < cancelBy.getTime();
  const cancelled = appt.status === 'cancelled';
  const done = appt.status === 'done';

  const addToCalendar = async () => {
    try {
      await Calendar.createEventInCalendarAsync({
        title: `${SERVICE_META[appt.service].title} with ${d.name}`,
        startDate: new Date(appt.start),
        endDate: new Date(new Date(appt.start).getTime() + appt.minutes * 60000),
        location: appt.service === 'clinic' ? d.clinic : 'DermAI video visit',
        notes: appt.reason,
      });
    } catch {
      Alert.alert('Calendar isn\'t available', 'Add it by hand: ' + `${weekdayDayMonth(appt.start)}, ${time(appt.start)}.`);
    }
  };

  const paid = appt.paymentMethod && appt.paymentMethod !== 'pay_at_visit' ? `${{ jazzcash: 'JazzCash', easypaisa: 'Easypaisa', card: 'Card' }[appt.paymentMethod]} chosen` : isMessage ? 'pay after the review' : 'pay at the visit';
  const sharedScan = appt.sharedScanIds[0] ? s.scans.find((x) => x.id === appt.sharedScanIds[0]) : undefined;

  return (
    <Screen
      edges={[]}
      header={<TopBar left="close" onLeft={close} />}
      footer={
        cancelled ? null : (
          <>
            {!isMessage && !done ? <Button label="Add to calendar" icon="calendar-plus" variant="ink" onPress={addToCalendar} /> : null}
            {thread ? (
              <Button
                label={`Message ${drShort(d.name)}`}
                variant="secondary"
                onPress={() => {
                  close();
                  router.push({ pathname: '/thread/[id]', params: { id: thread.id } });
                }}
              />
            ) : null}
          </>
        )
      }>
      <View style={{ alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: cancelled ? colors.surfaceMuted : colors.clinicianWash, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: cancelled ? colors.textMuted : colors.clinician, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={cancelled ? 'event-busy' : 'check'} size={34} color="#FFFFFF" />
          </View>
        </View>
        <Txt variant="display" align="center">
          {cancelled ? 'Visit cancelled' : done ? `Visit with ${drShort(d.name)}` : isMessage ? `Sent to ${drShort(d.name)}` : "You're booked"}
        </Txt>
        {cancelled && appt.cancelledBy === 'doctor' ? <StatusPill label={`Cancelled by ${drShort(d.name)}`} tone="act" /> : null}
        {cancelled && appt.cancelledBy === 'admin' ? <StatusPill label="Cancelled by DermAI support" tone="act" /> : null}
        {!cancelled && !done ? (
          <Txt variant="body" color="secondary" align="center">
            {sharedScan
              ? `${drShort(d.name)} will see your ${dayMonth(sharedScan.date)} scan ${isMessage ? 'and reply within 24 hours' : 'before the call'}.`
              : isMessage
                ? `${drShort(d.name)} replies within 24 hours.`
                : 'You can share a scan from the chat before the visit.'}
          </Txt>
        ) : null}
      </View>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar name={d.name} size={34} tone={listed?.tone ?? 3} uri={listed?.photoUrl} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{d.name}</Txt>
            <Txt variant="caption" color="muted">
              {SERVICE_META[appt.service].title}
              {appt.minutes ? `, ${appt.minutes} min` : ''}
            </Txt>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.md }} />
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="small" color="secondary">
              When
            </Txt>
            <Txt variant="smallStrong">{isMessage ? 'Reply within 24 hours' : `${weekdayDayMonth(appt.start)}, ${time(appt.start)}`}</Txt>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="small" color="secondary">
              Fee
            </Txt>
            <Txt variant="smallStrong">
              Rs {appt.fee.toLocaleString('en-US')}, {cancelled ? "you won't be charged" : paid}
            </Txt>
          </View>
          {appt.reason ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
              <Txt variant="small" color="secondary">
                About
              </Txt>
              <Txt variant="smallStrong" style={{ flex: 1, textAlign: 'right' }}>
                {appt.reason}
              </Txt>
            </View>
          ) : null}
        </View>
      </Card>
      {!isMessage && !done && !cancelled ? (
        <Txt variant="caption" color="muted" align="center">
          {s.settings.remindAm || s.settings.remindPm ? "We'll remind you an hour before." : 'Turn on reminders in Settings to get one an hour before.'}
        </Txt>
      ) : null}
      {done && listed ? (
        <View style={{ gap: space.sm, alignItems: 'center' }}>
          <Txt variant="bodyStrong">{appt.rating ? 'Thanks for rating your visit' : 'How was your visit?'}</Txt>
          <View style={{ flexDirection: 'row', gap: space.xs }} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                disabled={!!appt.rating}
                onPress={() => attempt(rateAppointment(appt.id, n), "Couldn't save your rating")}
                accessibilityRole="radio"
                accessibilityState={{ selected: (appt.rating ?? 0) >= n }}
                accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
                hitSlop={4}
                style={{ padding: 4 }}>
                <Icon name={(appt.rating ?? 0) >= n ? 'star' : 'star-border'} size={32} color={(appt.rating ?? 0) >= n ? colors.watchIcon : colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {canCancel ? (
        <View style={{ gap: space.sm }}>
          <Txt variant="small" color="secondary" align="center">
            Free to cancel until {time(cancelBy)} on {longWeekday(cancelBy)}.
          </Txt>
          <Button
            label="Cancel visit"
            variant="destructive"
            loading={cancelling}
            onPress={() =>
              Alert.alert('Cancel this visit?', 'You won\'t be charged.', [
                { text: 'Keep it', style: 'cancel' },
                {
                  text: 'Cancel visit',
                  style: 'destructive',
                  onPress: () => {
                    setCancelling(true);
                    cancelAppointment(appt.id)
                      .catch((e) => alertError(e, "Couldn't cancel"))
                      .finally(() => setCancelling(false));
                  },
                },
              ])
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

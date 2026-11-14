import * as Calendar from 'expo-calendar/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, EmptyState, IconTile, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DOCTORS, SERVICE_META } from '@/data/seed';
import { drShort, longWeekday, time, weekdayDayMonth } from '@/lib/format';
import { useActions, useApp } from '@/store/AppStore';
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
  const { cancelAppointment } = useActions();
  const [now] = useState(() => Date.now());
  const appt = s.appointments.find((a) => a.id === id);
  const d = DOCTORS.find((x) => x.id === appt?.doctorId);
  const thread = s.threads.find((t) => t.doctorId === appt?.doctorId);

  if (!appt || !d) {
    return (
      <Screen edges={[]} header={<TopBar left="close" onLeft={close} />}>
        <EmptyState icon="event-busy" title="Booking not found" body="It may have been cancelled." />
      </Screen>
    );
  }

  const isMessage = appt.service === 'message';
  const cancelBy = new Date(new Date(appt.start).getTime() - 2 * 3600000);
  const canCancel = appt.status === 'upcoming' && !isMessage && now < cancelBy.getTime();
  const cancelled = appt.status === 'cancelled';

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

  const items = [
    {
      icon: isMessage ? ('chat' as const) : ('event' as const),
      title: isMessage ? 'Case review by message' : `${weekdayDayMonth(appt.start)}, ${time(appt.start)}`,
      body: isMessage ? 'Reply within 24 hours' : `${SERVICE_META[appt.service].title}${appt.minutes ? `, ${appt.minutes} min` : ''}`,
    },
    appt.sharedScanIds.length
      ? { icon: 'photo-library' as const, title: `${appt.sharedScanIds.length} scan${appt.sharedScanIds.length === 1 ? '' : 's'} shared`, body: isMessage ? `${d.female ? 'She' : 'He'}'ll review them first` : `${d.female ? 'She' : 'He'}'ll see them before you join` }
      : null,
    isMessage ? null : { icon: 'notifications' as const, title: 'Reminder', body: '1 hour before' },
  ].filter(Boolean) as { icon: 'event' | 'chat' | 'photo-library' | 'notifications'; title: string; body: string }[];

  return (
    <Screen
      edges={[]}
      header={<TopBar left="close" onLeft={close} />}
      footer={
        cancelled ? null : (
          <>
            {!isMessage ? <Button label="Add to calendar" icon="calendar-plus" variant="secondary" onPress={addToCalendar} /> : null}
            <Button
              label={`Message ${drShort(d.name)}`}
              onPress={() => {
                close();
                if (thread) router.push({ pathname: '/thread/[id]', params: { id: thread.id } });
              }}
            />
          </>
        )
      }>
      <View style={{ alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: cancelled ? colors.surfaceMuted : colors.goodWash, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={cancelled ? 'event-busy' : 'event-available'} size={36} color={cancelled ? colors.textMuted : colors.goodIcon} />
        </View>
        <Txt variant="display" align="center">
          {cancelled ? 'Visit cancelled' : isMessage ? `Sent to ${drShort(d.name)}` : `You're booked with ${drShort(d.name)}`}
        </Txt>
      </View>
      <View style={{ gap: space.lg }}>
        {items.map((it) => (
          <View key={it.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <IconTile icon={it.icon} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{it.title}</Txt>
              <Txt variant="small" color="secondary">
                {it.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      {canCancel ? (
        <View style={{ gap: space.sm }}>
          <Txt variant="small" color="secondary" align="center">
            Free to cancel until {time(cancelBy)} on {longWeekday(cancelBy)}.
          </Txt>
          <Button
            label="Cancel visit"
            variant="destructive"
            onPress={() =>
              Alert.alert('Cancel this visit?', 'You won\'t be charged.', [
                { text: 'Keep it', style: 'cancel' },
                { text: 'Cancel visit', style: 'destructive', onPress: () => cancelAppointment(appt.id) },
              ])
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, EmptyState, Field, Screen, Segmented, TopBar, ToggleRow, Txt } from '@/components/ui/kit';
import { DOCTORS, SERVICE_META } from '@/data/seed';
import type { ServiceType } from '@/data/types';
import { drShort, monthName, pkr, shortDay, time, weekdayDayMonth } from '@/lib/format';
import { isOpen, nextDays, slotsFor } from '@/lib/slots';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/** E5 Pick a time: day strip, slot grid, scans to share, reason, total. */
export default function Book() {
  const { colors } = useTheme();
  const { id, service: svcParam } = useLocalSearchParams<{ id: string; service?: ServiceType }>();
  const s = useApp();
  const { book } = useActions();
  const d = DOCTORS.find((x) => x.id === id);
  const service = d?.services.find((x) => x.type === svcParam) ?? d?.services[0];
  const days = useMemo(() => nextDays(7), []);
  const [day, setDay] = useState(() => Math.max(0, days.findIndex((x) => isOpen(x))));
  const [slot, setSlot] = useState<string | null>(null);
  const [share, setShare] = useState(s.scans.length > 0);
  const [reason, setReason] = useState('');
  const [pay, setPay] = useState<'jazzcash' | 'card' | 'clinic'>('jazzcash');

  if (!d || !service) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="event-busy" title="Booking isn't available" body="This doctor isn't taking bookings right now." />
      </Screen>
    );
  }

  const isMessage = service.type === 'message';
  const slots = slotsFor(days[day], d.id, s.appointments);
  const shareIds = share ? s.scans.slice(0, 3).map((x) => x.id) : [];
  const pronoun = d.female ? 'she' : 'he';
  const canBook = (isMessage || !!slot) && (!isMessage || shareIds.length > 0 || reason.trim().length > 0);
  const label = isMessage ? `Send case to ${drShort(d.name)}` : slot ? `Book ${weekdayDayMonth(slot)}, ${time(slot)}` : 'Pick a time';

  const confirm = () => {
    const appt = book({ doctorId: d.id, service: service.type, start: isMessage ? new Date().toISOString() : slot!, reason: reason.trim(), shareScanIds: shareIds });
    router.replace({ pathname: '/booked/[id]', params: { id: appt.id } });
  };

  return (
    <Screen keyboard header={<TopBar title={SERVICE_META[service.type].title} />} footer={<Button label={label} disabled={!canBook} onPress={confirm} />}>
      {isMessage ? (
        <Card tone="brand">
          <Txt variant="small" color="brandDeep">
            {drShort(d.name)} reviews your scans and replies by message within 24 hours. You can send follow-up questions in the same thread.
          </Txt>
        </Card>
      ) : (
        <>
          <Txt variant="heading">{monthName(days[day])}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {days.map((x, i) => {
              const open = isOpen(x);
              const sel = i === day;
              return (
                <Pressable
                  key={x.toISOString()}
                  disabled={!open}
                  onPress={() => {
                    setDay(i);
                    setSlot(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel, disabled: !open }}
                  accessibilityLabel={`${weekdayDayMonth(x)}${open ? '' : ', closed'}`}
                  style={{
                    width: 52,
                    paddingVertical: space.sm,
                    borderRadius: radius.control,
                    alignItems: 'center',
                    backgroundColor: sel ? colors.ink : colors.surface,
                    borderWidth: 1,
                    borderColor: sel ? colors.ink : colors.border,
                    opacity: open ? 1 : 0.4,
                  }}>
                  <Txt variant="caption" style={{ color: sel ? colors.onInk : colors.textSecondary }}>
                    {shortDay(x)}
                  </Txt>
                  <Txt variant="heading" style={{ color: sel ? colors.onInk : colors.textPrimary }}>
                    {x.getDate()}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
          {slots.length === 0 ? (
            <Txt variant="small" color="secondary">
              No times this day. Pick another day.
            </Txt>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {slots.map((x) => {
                const sel = slot === x.iso;
                return (
                  <Pressable
                    key={x.iso}
                    disabled={x.taken}
                    onPress={() => setSlot(x.iso)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel, disabled: x.taken }}
                    accessibilityLabel={`${x.label}${x.taken ? ', taken' : ''}`}
                    style={{
                      width: '31.8%',
                      minHeight: 44,
                      borderRadius: radius.control,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: x.taken ? colors.surfaceMuted : sel ? colors.brand : colors.surface,
                      borderWidth: x.taken ? 0 : 1,
                      borderColor: sel ? colors.brand : colors.border,
                    }}>
                    <Txt
                      variant="smallStrong"
                      style={[{ color: sel ? colors.onFill : x.taken ? colors.textMuted : colors.textPrimary }, x.taken && { textDecorationLine: 'line-through', fontFamily: type.small.fontFamily }]}>
                      {x.label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
      {s.scans.length ? (
        <Card padded={false}>
          <ToggleRow
            title={`Share my last ${Math.min(3, s.scans.length)} scan${s.scans.length === 1 ? '' : 's'} with ${drShort(d.name)}`}
            subtitle={isMessage ? `So ${pronoun} can review them` : `So ${pronoun} can see them before you join`}
            value={share}
            onChange={setShare}
          />
        </Card>
      ) : null}
      <Field label="What would you like help with?" value={reason} onChangeText={setReason} placeholder="e.g. Painful chin bumps for 3 weeks" multiline />
      <Txt variant="heading">Payment</Txt>
      <Segmented
        value={pay}
        onChange={setPay}
        options={[
          { value: 'jazzcash', label: 'JazzCash' },
          { value: 'card', label: 'Card' },
          ...(service.type === 'clinic' ? [{ value: 'clinic' as const, label: 'At clinic' }] : []),
        ]}
      />
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Icon name="info-outline" size={16} color={colors.textMuted} />
        <Txt variant="caption" color="muted" style={{ flex: 1 }}>
          Payments aren&apos;t connected yet, so you won&apos;t be charged.
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="bodyStrong">Total</Txt>
        <Txt variant="heading">{pkr(service.fee)}</Txt>
      </View>
    </Screen>
  );
}

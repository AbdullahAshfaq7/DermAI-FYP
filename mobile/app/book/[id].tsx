import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, EmptyState, ErrorBanner, Field, List, Row, Screen, Segmented, shadow, StatusPill, TopBar, ToggleRow, Txt } from '@/components/ui/kit';
import { FITZ_ROMAN, SERVICE_META } from '@/data/seed';
import type { PaymentMethod, ServiceType } from '@/data/types';
import { errorMessage, isApiError } from '@/lib/api';
import { dayMonth, drShort, monthName, pkr, shortDay, time, weekdayDayMonth } from '@/lib/format';
import { doctorById } from '@/lib/selectors';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/** E5 Pick a time: day strip, slot grid, scans to share, reason, total. */
export default function Book() {
  const { colors } = useTheme();
  const { id, service: svcParam, start: wanted } = useLocalSearchParams<{ id: string; service?: ServiceType; start?: string }>();
  const s = useApp();
  const { book, slots: loadSlots } = useActions();
  const d = doctorById(s, id);
  const service = d?.services.find((x) => x.type === svcParam) ?? d?.services[0];
  type Day = { date: string; slots: { iso: string; label: string; taken: boolean }[] };
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [share, setShare] = useState(s.scans.length > 0);
  const [shareMore, setShareMore] = useState(false);
  const [reason, setReason] = useState('');
  const [pay, setPay] = useState<PaymentMethod>('pay_at_visit');
  const { busy, error, setError, run } = useSubmit();
  const visitType = service && service.type !== 'message' ? service.type : null;

  // Bumping `reload` refetches slots; `keepDay` keeps the chosen day (after a slot was taken).
  const [reload, setReload] = useState(0);
  const keepDay = useRef(false);
  const fetchSlots = useCallback((keep = false) => {
    keepDay.current = keep;
    setLoadError(null);
    setReload((n) => n + 1);
  }, []);
  const doctorId = d?.id;

  useEffect(() => {
    if (!doctorId || !visitType) return;
    let live = true;
    loadSlots(doctorId, visitType, 14)
      .then((r) => {
        if (!live) return;
        setDays(r.days);
        // Arriving from Ask DermAI's "Book this slot": open on that slot if it's still free.
        const wantedDay = wanted ? r.days.findIndex((x) => x.slots.some((y) => y.iso === wanted && !y.taken)) : -1;
        if (wantedDay >= 0 && !keepDay.current) {
          setDay(wantedDay);
          setSlot(wanted!);
        } else if (!keepDay.current) setDay(Math.max(0, r.days.findIndex((x) => x.slots.some((y) => !y.taken))));
      })
      .catch((e) => live && setLoadError(errorMessage(e)));
    return () => {
      live = false;
    };
  }, [doctorId, visitType, loadSlots, reload, wanted]);

  if (!d || !service) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="event-busy" title="Booking isn't available" body="This doctor isn't taking bookings right now." />
      </Screen>
    );
  }

  const isMessage = service.type === 'message';
  const current = days?.[day];
  const slots = current?.slots ?? [];
  const shareIds = share ? s.scans.slice(0, shareMore ? 3 : 1).map((x) => x.id) : [];
  const latest = s.scans[0];
  const canBook = (isMessage || !!slot) && (!isMessage || shareIds.length > 0 || reason.trim().length > 0);
  const label = isMessage ? `Send case to ${drShort(d.name)}` : slot ? `Book ${weekdayDayMonth(slot)}, ${time(slot)}` : 'Pick a time';

  const confirm = async () => {
    setError(null);
    try {
      const appt = await run(async () => {
        try {
          return await book({ doctorId: d.id, service: service.type, start: isMessage ? undefined : slot!, reason: reason.trim(), shareScanIds: shareIds, paymentMethod: pay });
        } catch (e) {
          if (isApiError(e) && (e.code === 'slot_taken' || e.code === 'slot_past')) {
            setSlot(null);
            fetchSlots(true);
          }
          throw e;
        }
      });
      if (appt) router.replace({ pathname: '/booked/[id]', params: { id: appt.id } });
    } catch {
      // run() already shows the error
    }
  };

  return (
    <Screen
      keyboard
      header={<TopBar title={SERVICE_META[service.type].title} />}
      footerStyle={[{ backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: space.lg }, shadow(colors, true)]}
      footer={
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{isMessage ? 'Reply within 24 hours' : slot ? `${weekdayDayMonth(slot)}, ${time(slot)}` : 'No time picked yet'}</Txt>
              <Txt variant="caption" color="muted">
                {pay === 'pay_at_visit' ? (service.type === 'clinic' ? 'Pay at the clinic' : 'Pay after the visit') : `${{ jazzcash: 'JazzCash', easypaisa: 'Easypaisa', card: 'Card' }[pay]} (online payment coming soon)`}
              </Txt>
            </View>
            <Txt variant="heading">{pkr(service.fee).replace('PKR', 'Rs')}</Txt>
          </View>
          <Button label={label} disabled={!canBook} loading={busy} onPress={() => void confirm()} />
        </>
      }>
      <ErrorBanner error={error} />
      {isMessage ? (
        <Card tone="brand">
          <Txt variant="small" color="brandDeep">
            {drShort(d.name)} reviews your scans and replies by message within 24 hours. You can send follow-up questions in the same thread.
          </Txt>
        </Card>
      ) : !days ? (
        loadError ? (
          <EmptyState icon="wifi-off" title="Couldn't load times" body={loadError} action="Try again" onAction={() => fetchSlots()} />
        ) : (
          <View style={{ padding: space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.brand} />
          </View>
        )
      ) : (
        <>
          <Txt variant="heading">{monthName(new Date(`${days[day].date}T12:00:00`))}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {days.map((dd, i) => {
              const x = new Date(`${dd.date}T12:00:00`);
              const open = dd.slots.some((y) => !y.taken);
              const sel = i === day;
              return (
                <Pressable
                  key={dd.date}
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
                    borderRadius: 16,
                    alignItems: 'center',
                    backgroundColor: sel ? colors.ink : colors.surface,
                    borderWidth: 0,
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
              {current && current.slots.length > 0 ? 'Fully booked this day. Pick another day.' : 'Closed this day. Pick another day.'}
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
                      minHeight: 40,
                      borderRadius: radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: x.taken ? colors.surfaceMuted : sel ? colors.brand : colors.surface,
                      borderWidth: x.taken ? 0 : 1.5,
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
      <Txt variant="heading">Share with {drShort(d.name)}</Txt>
      <List>
        {latest ? (
          <ToggleRow icon="blur-on" title="Latest scan" subtitle={`${dayMonth(latest.date)}, score ${latest.score}`} value={share} onChange={setShare} />
        ) : null}
        {latest && s.scans.length > 1 && share ? (
          <ToggleRow icon="history" iconTone="muted" title="Earlier scans too" subtitle={`Up to ${Math.min(2, s.scans.length - 1)} more, to show the trend`} value={shareMore} onChange={setShareMore} />
        ) : null}
        <Row icon="badge" iconTone="muted" title="Skin profile" subtitle={`${s.profile.tone != null ? `Type ${FITZ_ROMAN[s.profile.tone]}, ` : ''}${(s.profile.feel ?? 'skin type not set').toLowerCase()}`} right={<StatusPill label="Always" tone="neutral" />} />
      </List>
      <Txt variant="caption" color="muted">
        Photos leave your phone only for this doctor, until 30 days after the visit.
      </Txt>
      <Field label="What's going on?" value={reason} onChangeText={setReason} placeholder="e.g. Painful bump on chin, 3 weeks" multiline />
      <Txt variant="heading">Payment</Txt>
      <Segmented
        value={pay}
        onChange={setPay}
        options={[
          { value: 'pay_at_visit', label: service.type === 'clinic' ? 'At clinic' : 'Pay later' },
          { value: 'jazzcash', label: 'JazzCash' },
          { value: 'easypaisa', label: 'Easypaisa' },
          { value: 'card', label: 'Card' },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Icon name="info-outline" size={16} color={colors.textMuted} />
        <Txt variant="caption" color="muted" style={{ flex: 1 }}>
          {pay === 'pay_at_visit'
            ? `You pay ${drShort(d.name)} ${service.type === 'clinic' ? 'at the clinic' : service.type === 'video' ? 'after the visit' : 'after the review'}.`
            : "Online payment is coming soon. We'll save your choice and you won't be charged now."}
        </Txt>
      </View>
    </Screen>
  );
}

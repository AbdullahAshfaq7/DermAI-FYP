import { View } from 'react-native';

import { Card, EmptyState, List, Row, Screen, Stat, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { dayMonth, monthName, pkr } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** Earnings and payouts (from H8): fees actually booked by patients, this calendar month. */
export default function Earnings() {
  const s = useApp();
  const now = new Date();
  const pct = s.derm.commissionPct ?? 10;
  const ledger = s.derm.ledger ?? [];
  const thisMonth = ledger.filter((x) => {
    const d = new Date(x.start);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const earned = thisMonth.filter((x) => x.status === 'done');
  const booked = thisMonth.filter((x) => x.status === 'upcoming');
  const sum = (xs: typeof ledger) => xs.reduce((n, x) => n + x.fee, 0);
  const gross = sum(earned);
  const commission = Math.round((gross * pct) / 100);

  return (
    <Screen header={<TopBar title="Earnings and payouts" />}>
      <Txt variant="heading">{monthName(now)}</Txt>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={pkr(gross - commission)} label="Earned, after fees" />
        <Stat value={pkr(sum(booked))} label="Booked, not yet seen" />
      </View>
      {thisMonth.length === 0 ? (
        <EmptyState icon="payments" title="Nothing this month yet" body="Fees from visits and case reviews show here once patients book you." />
      ) : (
        <List>
          {thisMonth.map((x) => (
            <Row
              key={x.id}
              title={x.patientName}
              subtitle={`${SERVICE_META[x.service].short} · ${dayMonth(x.start)}`}
              value={pkr(x.fee)}
              right={x.status === 'upcoming' ? <StatusPill label="Booked" tone="clinician" /> : undefined}
            />
          ))}
          {gross ? <Row title={`DermAI fee (${pct}%)`} value={`– ${pkr(commission)}`} /> : null}
        </List>
      )}
      <Card tone="clinician">
        <Txt variant="small" color="clinician">
          Patients pay you at the visit for now. Online payments and payouts (bank transfer or JazzCash) are coming soon.
        </Txt>
      </Card>
    </Screen>
  );
}

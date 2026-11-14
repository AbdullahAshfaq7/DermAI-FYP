import { View } from 'react-native';

import { Card, List, Row, Screen, Stat, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { dayMonth, pkr } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** Earnings and payouts (from H8). Figures come from booked visits; payouts need a payment provider. */
export default function Earnings() {
  const s = useApp();
  const fee = (t: 'video' | 'clinic' | 'message' | undefined) => (t ? s.derm.services[t].fee : 0);
  const visits = s.derm.visits.filter((v) => v.kind === 'visit');
  const reviews = s.derm.cases.filter((c) => c.channel === 'message' && c.status !== 'waiting');
  const gross = visits.reduce((n, v) => n + fee(v.service), 0) + reviews.length * s.derm.services.message.fee;
  const commission = Math.round(gross * 0.1);

  return (
    <Screen header={<TopBar title="Earnings and payouts" />}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={pkr(gross - commission)} label="This month, after fees" />
      </View>
      <List>
        {visits.map((v) => (
          <Row key={v.id} title={v.patientName ?? 'Visit'} subtitle={`${v.service ? SERVICE_META[v.service].short : ''} · ${dayMonth(v.start)}`} value={pkr(fee(v.service))} />
        ))}
        {reviews.map((c) => (
          <Row key={c.id} title={c.patient.name} subtitle={`Message review · ${dayMonth(c.receivedAt)}`} value={pkr(s.derm.services.message.fee)} />
        ))}
        <Row title="DermAI fee (10%)" value={`– ${pkr(commission)}`} />
      </List>
      <Card tone="clinician">
        <Txt variant="small" color="clinician">
          Payouts aren&apos;t connected yet. The commission rate and payout method (bank transfer or JazzCash) are still to be decided.
        </Txt>
      </Card>
    </Screen>
  );
}

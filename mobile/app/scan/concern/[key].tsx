import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Banner, Card, Disclaimer, EmptyState, IconTile, levelTone, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { FaceMap, TrendLine } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import type { ConcernKey } from '@/data/types';
import { dayMonth } from '@/lib/format';
import { scanById, trendWord, whereText, zonesForConcern } from '@/lib/selectors';
import { useActions, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** C6 Concern detail: where it is, the trend, what helps and when to see a doctor. */
export default function ConcernDetail() {
  const { colors } = useTheme();
  const { key, scan: scanId } = useLocalSearchParams<{ key: ConcernKey; scan?: string }>();
  const { state } = useStore();
  const { toggleSaved } = useActions();
  const info = CONCERNS[key];
  const scan = scanById(state, scanId) ?? state.scans[0];

  if (!info || !scan) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="search" title="Nothing to show yet" body="Take a scan to see how this concern looks on your skin." />
      </Screen>
    );
  }

  const idx = state.scans.findIndex((s) => s.id === scan.id);
  const history = state.scans.slice(idx, idx + 4).reverse();
  const values = history.map((s) => s.concerns[info.key].pct);
  const reading = scan.concerns[info.key];

  return (
    <Screen header={<TopBar right={<StatusPill label={reading.level} tone={levelTone(reading.level)} />} />}>
      <Txt variant="display">{info.label}</Txt>
      <Txt variant="body" color="secondary">
        {whereText(scan, info.key)} {info.toneNote}
      </Txt>
      <View style={{ alignItems: 'center' }}>
        <FaceMap zones={zonesForConcern(scan, info.key)} width={130} concernLabel={info.label.toLowerCase()} onZonePress={() => {}} />
      </View>
      <Card>
        <Txt variant="small" color="secondary">
          {history.length > 1 ? `Last ${history.length} scans` : 'First reading'}
        </Txt>
        <TrendLine values={values} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
          <Txt variant="small" color="secondary">
            {dayMonth(history[0].date)}
          </Txt>
          <Txt variant="small" color="secondary">
            {history.length > 1 ? `${dayMonth(scan.date)}, ${trendWord(values)}` : `${reading.pct}% visible`}
          </Txt>
        </View>
      </Card>
      <Txt variant="heading">What helps</Txt>
      <List>
        {info.helps.map((h) => {
          const saved = state.saved.some((s) => s.title === h.title);
          return (
            <Row
              key={h.title}
              leading={<IconTile icon={h.icon} />}
              title={h.title}
              subtitle={h.subtitle}
              onPress={() => toggleSaved({ id: `sv-${Date.now()}`, kind: 'ingredient', title: h.title, subtitle: h.subtitle, icon: h.icon, source: `${info.label} detail` })}
              label={`${h.title}. ${saved ? 'Saved. Tap to remove.' : 'Tap to save.'}`}
              right={<Icon name={saved ? 'bookmark' : 'bookmark-border'} size={22} color={saved ? colors.brand : colors.textMuted} />}
            />
          );
        })}
      </List>
      <Banner text={info.doctorHint} action="Find one" onAction={() => router.push('/doctors')} />
      <Disclaimer />
    </Screen>
  );
}

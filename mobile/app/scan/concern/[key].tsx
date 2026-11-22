import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, Disclaimer, EmptyState, IconButton, IconTile, levelTone, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { TrendLine } from '@/components/visual';
import { CONCERNS, FITZ_ROMAN } from '@/data/seed';
import type { ConcernKey } from '@/data/types';
import { dayMonth } from '@/lib/format';
import { buildRoutine } from '@/lib/routine';
import { scanById, trendWord, whereText } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** C6 Concern detail: trend, advice for this tone, and when to see a doctor. */
export default function ConcernDetail() {
  const { colors } = useTheme();
  const { key, scan: scanId } = useLocalSearchParams<{ key: ConcernKey; scan?: string }>();
  const state = useApp();
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
  const trend = trendWord(values);
  const routine = [...buildRoutine('am', state.profile, state.routinePrefs, state.scans[0]), ...buildRoutine('pm', state.profile, state.routinePrefs, state.scans[0])];
  const inRoutine = (title: string) => {
    const t = title.toLowerCase();
    return routine.some((s) => [s.title, ...s.ingredients].some((n) => t.includes(n.toLowerCase().replace(/\s*\d+%$/, '')) || n.toLowerCase().includes(t.split(' ')[0])));
  };
  const saved = state.saved.some((s) => s.title === info.label);
  const tone = state.profile.tone;

  return (
    <Screen
      header={
        <TopBar
          right={
            <IconButton
              icon={saved ? 'bookmark' : 'bookmark-border'}
              label={saved ? 'Remove from saved' : 'Save'}
              color={saved ? colors.brand : undefined}
              onPress={() => attempt(toggleSaved({ id: `sv-${Date.now()}`, kind: 'tip', title: info.label, subtitle: info.toneNote, icon: info.icon, source: 'Results' }))}
            />
          }
        />
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="display">{info.label}</Txt>
        <StatusPill label={reading.level} tone={levelTone(reading.level)} />
      </View>
      <Txt variant="body" color="secondary">
        {whereText(scan, info.key)}
      </Txt>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">{history.length > 1 ? `Last ${history.length} scans` : 'First reading'}</Txt>
          {history.length > 1 ? (
            <StatusPill
              icon={trend === 'easing' ? 'trending-down' : trend === 'rising' ? 'trending-up' : 'trending-flat'}
              label={trend === 'easing' ? 'Easing' : trend === 'rising' ? 'Rising' : 'Steady'}
              tone={trend === 'easing' ? 'good' : trend === 'rising' ? 'watch' : 'neutral'}
            />
          ) : null}
        </View>
        <TrendLine values={values} height={74} dots="all" invert />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs }}>
          <Txt variant="caption" color="muted">
            {dayMonth(history[0].date)}, {values[0]}
          </Txt>
          <Txt variant="caption" color="muted">
            {dayMonth(scan.date)}, {reading.pct}
          </Txt>
        </View>
      </Card>
      <Card tone="peach">
        <Txt variant="bodyStrong" color="peach">
          {tone != null ? `On type ${FITZ_ROMAN[tone]} skin` : 'On your skin tone'}
        </Txt>
        <Txt variant="small" color="peach" style={{ marginTop: 2 }}>
          {info.toneNote}
        </Txt>
      </Card>
      <Txt variant="heading">What helps</Txt>
      <List>
        {info.helps.map((h) => (
          <Row
            key={h.title}
            leading={<IconTile icon={h.icon} size={36} tone={h.icon === 'wb-sunny' ? 'peach' : 'brand'} />}
            title={h.title}
            subtitle={h.subtitle}
            right={inRoutine(h.title) ? <StatusPill label="In routine" tone="brand" /> : null}
          />
        ))}
      </List>
      <Card tone="clinician" onPress={() => router.push('/doctors')} label="Find a dermatologist">
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <Icon name="stethoscope" size={22} color={colors.clinicianDeep} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodyStrong" color="clinician">
              See a dermatologist if
            </Txt>
            <Txt variant="small" color="clinician">
              {info.doctorHint}
            </Txt>
          </View>
          <Icon name="chevron-right" size={22} color={colors.clinicianDeep} />
        </View>
      </Card>
      <Button label="See my routine" variant="soft" onPress={() => router.navigate('/routine')} />
      <Disclaimer />
    </Screen>
  );
}

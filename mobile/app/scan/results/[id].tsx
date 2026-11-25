import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Button, Disclaimer, EmptyState, IconButton, LoadingState, levelTone, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { FaceMap, MapTag } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import type { ConcernKey, ZoneKey } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, time } from '@/lib/format';
import { previousScan, scanById, summaryLine, useCountUp, zoneName } from '@/lib/selectors';
import { useApp, useRefreshIfMissing } from '@/store/AppStore';
import { concernScale, nightColors } from '@/theme/colors';
import { NightTheme, useTheme } from '@/theme/ThemeProvider';
import { space, type } from '@/theme/tokens';

function close() {
  if (router.canDismiss()) router.dismissTo('/home');
  else router.replace('/home');
}

const RANK = { Clear: 0, Mild: 1, Moderate: 2, High: 3 } as const;
const TAG_POS: Record<ZoneKey, object> = {
  forehead: { right: 16, top: 26 },
  nose: { right: 12, top: 96 },
  leftCheek: { left: 12, top: 120 },
  rightCheek: { right: 12, top: 136 },
  chin: { right: 16, bottom: 14 },
};

/** C5 Results (Night): summary first, then the map; tap a zone or a row for C6. */
export default function Results() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const state = useApp();
  const scan = scanById(state, id);
  const checking = useRefreshIfMissing(!scan);
  const score = useCountUp(scan?.score ?? 0, fresh === '1');
  const [w, setW] = useState(0);

  if (!scan) {
    return (
      <Screen header={<TopBar left="close" onLeft={close} />}>
        {checking ? (
          <LoadingState label="Loading scan" />
        ) : (
          <EmptyState icon="history" title="This scan isn't here any more" body="It may have been deleted. Your other scans are in Scan history." action="Scan history" onAction={() => router.replace('/history')} />
        )}
      </Screen>
    );
  }

  const prev = previousScan(state, scan);
  const delta = prev ? scan.score - prev.score : null;
  const ranked = rankedConcerns(scan);
  const notable = ranked.filter((k) => scan.concerns[k].level !== 'Clear').slice(0, 3);
  const rest = ranked.filter((k) => !notable.includes(k));
  const restClear = rest.filter((k) => scan.concerns[k].level === 'Clear').length;
  const restMild = rest.length - restClear;
  const restLine = !rest.length
    ? 'All six shown'
    : restMild && restClear
      ? `${rest.length} more: ${restMild} mild, ${restClear} clear`
      : restMild
        ? `${restMild} more ${restMild === 1 ? 'is' : 'are'} mild`
        : `${restClear} more look${restClear === 1 ? 's' : ''} clear`;
  const tagged = (Object.keys(scan.zones) as ZoneKey[]).filter((z) => RANK[scan.zones[z]] >= 2).slice(0, 2);
  const open = (key: ConcernKey) => router.push({ pathname: '/scan/concern/[key]', params: { key, scan: scan.id } });

  return (
    <View style={{ flex: 1, backgroundColor: nightColors.bg }}>
      <NightTheme>
        <View style={{ paddingTop: insets.top }}>
          <TopBar
            left="close"
            onLeft={close}
            title={`${dayMonth(scan.date)}, ${time(scan.date)}`}
            right={
              <IconButton
                icon="ios-share"
                label="Share results"
                onPress={() =>
                  Share.share({
                    message: `My DermAI skin scan, ${dayMonth(scan.date)}: ${scan.score}/100. ${notable
                      .map((k) => `${CONCERNS[k].label} ${scan.concerns[k].level.toLowerCase()}`)
                      .join(', ')}. DermAI gives guidance, not a diagnosis.`,
                  })
                }
              />
            }
          />
          <View style={{ height: 210, marginHorizontal: space.screen }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {w ? (
              <FaceMap
                zones={scan.zones}
                width={w}
                height={210}
                density={22}
                onZonePress={(z) => open(ranked.find((k) => scan.where[k]?.includes(z)) ?? ranked[0])}
              />
            ) : null}
            <View style={{ position: 'absolute', left: 2, top: 4 }} accessibilityLabel={`Skin score ${scan.score} out of 100`}>
              <Txt variant="score" style={{ fontSize: 50 }}>
                {score}
              </Txt>
              <Txt variant="caption" color="secondary">
                Skin score
              </Txt>
              {delta != null ? (
                <View style={{ marginTop: 6 }}>
                  <StatusPill icon={delta >= 0 ? 'trending-up' : 'trending-down'} label={`${delta >= 0 ? '+' : ''}${delta}`} tone={delta >= 0 ? 'good' : 'act'} />
                </View>
              ) : (
                <View style={{ marginTop: 6 }}>
                  <StatusPill label="First scan" tone="brand" />
                </View>
              )}
            </View>
            {tagged.map((z) => (
              <MapTag key={z} label={zoneName(z)} level={scan.zones[z]} style={TAG_POS[z]} />
            ))}
          </View>
        </View>
      </NightTheme>
      <View style={{ flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: space.md }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 9, backgroundColor: colors.border, marginTop: space.sm }} />
        <ScrollView contentContainerStyle={{ padding: space.screen, paddingTop: space.md, gap: space.md, paddingBottom: insets.bottom + space.lg }}>
          <Txt variant="heading">{summaryLine(scan)}</Txt>
          {scan.quality === 'dim' ? <Banner tone="butter" icon="wb-sunny" text="This photo was a little dim, so we scored it with caution." /> : null}
          {notable.length ? (
            <List>
              {notable.map((k) => (
                <Row
                  key={k}
                  onPress={() => open(k)}
                  label={`${CONCERNS[k].label}, ${scan.concerns[k].level}`}
                  leading={<View style={{ width: 4, alignSelf: 'stretch', borderRadius: 9, backgroundColor: concernScale[scan.concerns[k].level] }} />}
                  title={CONCERNS[k].label}
                  subtitle={(scan.where[k] ?? []).map(zoneName).join(', ') || 'Across your face'}
                  right={<StatusPill label={scan.concerns[k].level} tone={levelTone(scan.concerns[k].level)} />}
                  chevron
                />
              ))}
            </List>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="small" color="muted">
              {restLine}
            </Txt>
            <Txt variant="smallStrong" color="brand" style={type.smallStrong} onPress={() => router.push({ pathname: '/scan/concerns/[id]', params: { id: scan.id } })}>
              See all six
            </Txt>
          </View>
          <Button
            label="See my routine"
            onPress={() => {
              close();
              router.navigate('/routine');
            }}
          />
          <Disclaimer />
        </ScrollView>
      </View>
    </View>
  );
}

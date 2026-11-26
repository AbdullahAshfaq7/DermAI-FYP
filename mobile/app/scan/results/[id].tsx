import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcernTile, ScoreRing } from '@/components/skin';
import { Icon } from '@/components/ui/Icon';
import { Banner, Button, Disclaimer, EmptyState, IconButton, LoadingState, Screen, TopBar, Txt, shadow } from '@/components/ui/kit';
import { FaceMap, MapTag } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import type { ConcernKey, ZoneKey } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, time } from '@/lib/format';
import { exportReport } from '@/lib/report';
import { previousScan, scanById, summaryLine, useCountUp, zoneName } from '@/lib/selectors';
import { useApp, useRefreshIfMissing } from '@/store/AppStore';
import { nightColors } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function close() {
  if (router.canDismiss()) router.dismissTo('/home');
  else router.replace('/home');
}

const RANK = { Clear: 0, Mild: 1, Moderate: 2, High: 3 } as const;
const MAP_H = 200;
const TAG_POS: Record<ZoneKey, object> = {
  forehead: { right: 12, top: 18 },
  nose: { right: 10, top: 84 },
  leftCheek: { left: 10, top: 106 },
  rightCheek: { right: 10, top: 122 },
  chin: { right: 14, bottom: 12 },
};

function Pill({ icon, label }: { icon?: 'trending-up' | 'trending-down' | 'auto-awesome' | 'verified' | 'wb-sunny'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
      {icon ? <Icon name={icon} size={14} color="#FFFFFF" /> : null}
      <Txt variant="caption" style={{ color: '#FFFFFF' }}>
        {label}
      </Txt>
    </View>
  );
}

/** C5 Results: the score on the brand gradient, where on the face, all six concerns worst first, then the routine and the PDF report. */
export default function Results() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const state = useApp();
  const scan = scanById(state, id);
  const checking = useRefreshIfMissing(!scan);
  const score = useCountUp(scan?.score ?? 0, fresh === '1');
  const [w, setW] = useState(0);
  const [exporting, setExporting] = useState(false);

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
  const tagged = (Object.keys(scan.zones) as ZoneKey[]).filter((z) => RANK[scan.zones[z]] >= 2).slice(0, 2);
  const open = (key: ConcernKey) => router.push({ pathname: '/scan/concern/[key]', params: { key, scan: scan.id } });
  const share = () =>
    Share.share({
      message: `My DermAI skin scan, ${dayMonth(scan.date)}: ${scan.score}/100. ${notable
        .map((k) => `${CONCERNS[k].label} ${scan.concerns[k].level.toLowerCase()}`)
        .join(', ')}. DermAI gives guidance, not a diagnosis.`,
    });
  const download = async () => {
    setExporting(true);
    try {
      await exportReport(state, scan);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top }}>
        <TopBar left="close" onLeft={close} title={`${dayMonth(scan.date)}, ${time(scan.date)}`} right={<IconButton icon="ios-share" label="Share results" onPress={() => void share()} />} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screen, paddingTop: space.xs, gap: space.md, paddingBottom: insets.bottom + space.xl }}>
        {/* Score */}
        <View style={[{ borderRadius: radius.card, overflow: 'hidden' }, shadow(colors, true)]}>
          <LinearGradient colors={[colors.brand, colors.brandAlt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.lg + 2, gap: space.md, alignItems: 'center' }}>
            <View accessibilityLabel={`Skin score ${scan.score} out of 100`}>
              <ScoreRing score={score} size={128} onDark />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
              {delta != null ? <Pill icon={delta >= 0 ? 'trending-up' : 'trending-down'} label={`${delta >= 0 ? '+' : ''}${delta} since last scan`} /> : <Pill icon="auto-awesome" label="First scan" />}
              <Pill icon={scan.quality === 'dim' ? 'wb-sunny' : 'verified'} label={`${scan.confidence ?? 80}% confidence`} />
            </View>
            <Txt variant="heading" align="center" style={{ color: '#FFFFFF' }}>
              {summaryLine(scan)}
            </Txt>
          </LinearGradient>
        </View>

        {scan.quality === 'dim' ? <Banner tone="watch" icon="wb-sunny" text="This photo was a little dim, so we scored it with caution." /> : null}

        {/* Where on the face */}
        <View style={[{ borderRadius: radius.card, backgroundColor: nightColors.bg, padding: space.md, gap: space.xs }, shadow(colors)]}>
          <Txt variant="smallStrong" style={{ color: nightColors.textPrimary }}>
            Where on your face
          </Txt>
          <Txt variant="caption" style={{ color: nightColors.textSecondary }}>
            Tap a zone to see what was found there.
          </Txt>
          <View style={{ height: MAP_H, marginTop: space.xs }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {w ? <FaceMap zones={scan.zones} width={w} height={MAP_H} density={22} onZonePress={(z) => open(ranked.find((k) => scan.where[k]?.includes(z)) ?? ranked[0])} /> : null}
            {tagged.map((z) => (
              <MapTag key={z} label={zoneName(z)} level={scan.zones[z]} style={TAG_POS[z]} />
            ))}
          </View>
        </View>

        {/* All six */}
        <Txt variant="heading" style={{ marginTop: space.xs }}>
          Your six concerns
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {ranked.map((k) => (
            <ConcernTile key={k} k={k} reading={scan.concerns[k]} onPress={() => open(k)} />
          ))}
        </View>

        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button
            label="See my routine"
            icon="spa"
            onPress={() => {
              close();
              router.navigate('/routine');
            }}
          />
          <Button label="Download report (PDF)" icon="picture-as-pdf" variant="secondary" loading={exporting} onPress={() => void download()} />
        </View>
        <Disclaimer />
      </ScrollView>
    </View>
  );
}

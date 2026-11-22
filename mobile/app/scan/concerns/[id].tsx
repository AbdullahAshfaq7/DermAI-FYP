import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ProgressBar, Screen, TopBar, Txt } from '@/components/ui/kit';
import { LevelDot } from '@/components/visual';
import { CONCERN_ORDER, CONCERNS } from '@/data/seed';
import type { ConcernKey } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';
import { previousScan, scanById, trendWord } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { concernScale } from '@/theme/colors';
import { NightTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/** C7 All six concerns (Night): every concern at a glance, worst first. */
function AllConcerns() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApp();
  const scan = scanById(state, id) ?? state.scans[0];
  if (!scan) return null;
  const prev = previousScan(state, scan);
  const order = rankedConcerns(scan);
  const open = (key: ConcernKey) => router.push({ pathname: '/scan/concern/[key]', params: { key, scan: scan.id } });

  const caption = (k: ConcernKey) => {
    const r = scan.concerns[k];
    if (!prev) return r.level;
    const t = trendWord([prev.concerns[k].pct, r.pct]);
    const d = r.pct - prev.concerns[k].pct;
    if (r.level === 'Clear') return d >= 3 ? `Clear, up ${d}` : 'Clear';
    return `${r.level}, ${t === 'easing' ? 'easing' : t === 'rising' ? 'rising' : 'steady'}`;
  };

  return (
    <Screen header={<TopBar title="All six concerns" />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {(order.length ? order : CONCERN_ORDER).map((k) => {
          const r = scan.concerns[k];
          return (
            <Pressable
              key={k}
              onPress={() => open(k)}
              accessibilityRole="button"
              accessibilityLabel={`${CONCERNS[k].label}, ${r.pct}, ${caption(k)}`}
              style={({ pressed }) => ({ width: '48.6%', backgroundColor: colors.surface, borderRadius: radius.card, padding: space.md + 2, gap: 6, opacity: pressed ? 0.85 : 1 })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt variant="bodyStrong">{CONCERNS[k].label}</Txt>
                <LevelDot level={r.level} />
              </View>
              <Txt variant="number" style={[type.number, { fontSize: 30, lineHeight: 34 }]}>
                {r.pct}
              </Txt>
              <ProgressBar value={r.pct} color={concernScale[r.level]} />
              <Txt variant="caption" color="secondary">
                {caption(k)}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Txt variant="caption" color="muted" align="center">
        Higher numbers need more care. DermAI gives guidance, not a diagnosis.
      </Txt>
    </Screen>
  );
}

export default function AllConcernsScreen() {
  return (
    <NightTheme>
      <AllConcerns />
    </NightTheme>
  );
}

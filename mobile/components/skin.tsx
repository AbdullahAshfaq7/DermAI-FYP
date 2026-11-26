import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar, Txt, shadow } from '@/components/ui/kit';
import { CONCERNS } from '@/data/seed';
import type { ConcernKey, ConcernReading } from '@/data/types';
import { concernHue } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** Score in a gradient ring, like a fitness ring: fuller is better. */
export function ScoreRing({ score, size, onDark }: { score: number; size: number; onDark?: boolean }) {
  const { colors } = useTheme();
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="scoreRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={colors.brandAlt} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={onDark ? 'rgba(255,255,255,0.25)' : colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={onDark ? '#FFFFFF' : 'url(#scoreRing)'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt variant="number" style={{ fontSize: 28, lineHeight: 30, color: onDark ? '#FFFFFF' : colors.textPrimary }}>
        {score}
      </Txt>
      <Txt variant="caption" style={{ color: onDark ? 'rgba(255,255,255,0.85)' : colors.textMuted }}>
        Score
      </Txt>
    </View>
  );
}

/** One concern: its own colour, how much of it the last scan saw, and the level. */
export function ConcernTile({ k, reading, onPress }: { k: ConcernKey; reading?: ConcernReading; onPress: () => void }) {
  const { colors } = useTheme();
  const hue = concernHue[k];
  const info = CONCERNS[k];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={reading ? `${info.label}, ${reading.pct} percent, ${reading.level}` : `${info.label}, not scanned yet`}
      style={({ pressed }) => [
        { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.control + 2, padding: space.md, gap: space.sm, opacity: pressed ? 0.85 : 1 },
        shadow(colors),
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${hue}22`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={info.icon as IconName} size={18} color={hue} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="smallStrong" numberOfLines={1}>
            {info.label}
          </Txt>
          {reading ? (
            <Txt variant="caption" color="muted" numberOfLines={1}>
              <Txt variant="smallStrong" style={{ color: hue }}>
                {reading.pct}%
              </Txt>{' '}
              {reading.level}
            </Txt>
          ) : (
            <Txt variant="caption" color="muted">
              Not scanned yet
            </Txt>
          )}
        </View>
      </View>
      <ProgressBar value={reading?.pct ?? 0} color={hue} track={`${hue}1F`} />
    </Pressable>
  );
}

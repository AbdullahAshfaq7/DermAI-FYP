import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Polyline, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/kit';
import { CONCERNS, ZONE_LABEL } from '@/data/seed';
import type { ConcernKey, ConcernLevel, ConcernReading, ZoneKey } from '@/data/types';
import { concernScale, fitzpatrick } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/* ───────────── Logo: lens of six Fitzpatrick bands inside an open teal ring ───────────── */

export function LogoMark({ size = 40, ring }: { size?: number; ring?: string }) {
  const { colors } = useTheme();
  const r = 14;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="DermAI">
      <Defs>
        <ClipPath id="lens">
          <Circle cx="20" cy="20" r={r} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#lens)">
        {fitzpatrick.map((c, i) => (
          <Rect key={c} x={6 + (i * 28) / 6} y="4" width={28 / 6 + 0.3} height="32" fill={c} />
        ))}
      </G>
      <Path d="M 33.5 13 A 16 16 0 1 1 27 5.4" stroke={ring ?? colors.brand} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({ size = 28, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  return <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: size, letterSpacing: -size * 0.02, color: color ?? colors.textPrimary }}>dermai</Text>;
}

/* ───────────── Face map ───────────── */

const ZONE_ORDER: ZoneKey[] = ['forehead', 'nose', 'leftCheek', 'rightCheek', 'chin'];

export function FaceMap({
  zones,
  width = 160,
  onZonePress,
  selected,
  animate,
  concernLabel,
}: {
  zones: Record<ZoneKey, ConcernLevel> | null;
  width?: number;
  onZonePress?: (zone: ZoneKey) => void;
  selected?: ZoneKey | null;
  animate?: boolean;
  concernLabel?: string;
}) {
  const { colors, isDark } = useTheme();
  const [shown, setShown] = useState(animate ? 0 : 5);

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) return setShown(5);
      let n = 0;
      const t = setInterval(() => {
        n += 1;
        setShown(n);
        if (n >= 5) clearInterval(t);
      }, 80);
    });
    return () => {
      cancelled = true;
    };
  }, [animate]);

  const skin = isDark ? '#3A2C27' : '#F6E7E0';
  const outline = isDark ? '#6B544B' : '#DCC6BC';
  const feature = isDark ? '#C9B3A8' : '#5A4038';
  const fill = (z: ZoneKey) => {
    if (!zones || ZONE_ORDER.indexOf(z) >= shown) return skin;
    return concernScale[zones[z]];
  };
  const stroke = (z: ZoneKey) => (selected === z ? colors.brand : 'transparent');
  const press = (z: ZoneKey) => (onZonePress ? () => onZonePress(z) : undefined);
  const height = (width * 200) / 160;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 160 200">
        <Ellipse cx="80" cy="100" rx="72" ry="94" fill={skin} stroke={outline} strokeWidth="1.5" />
        <Path d="M28 56 Q80 18 132 56 L124 76 Q80 50 36 76 Z" fill={fill('forehead')} stroke={stroke('forehead')} strokeWidth="2.5" onPress={press('forehead')} />
        <Path d="M68 80 L92 80 L98 122 Q80 130 62 122 Z" fill={fill('nose')} stroke={stroke('nose')} strokeWidth="2.5" onPress={press('nose')} />
        <Circle cx="38" cy="116" r="22" fill={fill('leftCheek')} stroke={stroke('leftCheek')} strokeWidth="2.5" onPress={press('leftCheek')} />
        <Circle cx="122" cy="116" r="22" fill={fill('rightCheek')} stroke={stroke('rightCheek')} strokeWidth="2.5" onPress={press('rightCheek')} />
        <Ellipse cx="80" cy="170" rx="26" ry="13" fill={fill('chin')} stroke={stroke('chin')} strokeWidth="2.5" onPress={press('chin')} />
        <Path d="M42 84 Q54 78 64 84 M96 84 Q106 78 118 84" stroke={feature} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Path d="M64 146 Q80 156 96 146" stroke={feature} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {zones && shown >= 5
          ? ZONE_ORDER.filter((z) => zones[z] === 'Moderate' || zones[z] === 'High').map((z) => {
              const pos = { forehead: [80, 46], nose: [80, 102], leftCheek: [34, 116], rightCheek: [126, 116], chin: [80, 170] }[z];
              return <Circle key={z} cx={pos[0]} cy={pos[1]} r="2.8" fill={feature} />;
            })
          : null}
      </Svg>
      {/* Accessible, tappable targets that mirror the zones for screen readers. */}
      {zones && onZonePress
        ? ZONE_ORDER.map((z) => {
            const box = { forehead: [30, 24, 100, 46], nose: [62, 80, 36, 50], leftCheek: [16, 94, 44, 44], rightCheek: [100, 94, 44, 44], chin: [54, 157, 52, 26] }[z];
            const k = width / 160;
            return (
              <Pressable
                key={z}
                onPress={() => onZonePress(z)}
                accessibilityRole="button"
                accessibilityLabel={`${ZONE_LABEL[z][0].toUpperCase()}${ZONE_LABEL[z].slice(1)}, ${concernLabel ? `${concernLabel} ` : ''}${zones[z].toLowerCase()}`}
                style={{ position: 'absolute', left: box[0] * k, top: box[1] * k, width: box[2] * k, height: box[3] * k }}
              />
            );
          })
        : null}
    </View>
  );
}

/** A soft teal line that sweeps over the face map while the scan is analysed. */
export function ScanSweep({ height, width }: { height: number; width: number }) {
  const { colors } = useTheme();
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(y, { toValue: height - 6, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [height, y]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, width, height: 4, borderRadius: 2, backgroundColor: colors.brand, opacity: 0.7, transform: [{ translateY: y }] }}
    />
  );
}

export function LevelLegend({ compact }: { compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: compact ? space.sm : space.md, justifyContent: 'center' }}>
      {(Object.keys(concernScale) as ConcernLevel[]).map((l) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: concernScale[l] }} />
          <Txt variant="caption" color="secondary">
            {l}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/* ───────────── Concerns ───────────── */

export function ConcernBar({ reading }: { reading: ConcernReading }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${reading.pct}%`, height: '100%', borderRadius: 3, backgroundColor: concernScale[reading.level] }} />
    </View>
  );
}

export function concernIcon(key: ConcernKey) {
  return CONCERNS[key].icon;
}

/* ───────────── Charts ───────────── */

export function TrendLine({
  values,
  height = 70,
  color,
  dots = 'last',
  invert,
}: {
  values: number[];
  height?: number;
  color?: string;
  dots?: 'all' | 'last';
  /** Draw lower values higher (for concerns, where down is good). */
  invert?: boolean;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const c = color ?? colors.brand;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : 6 + (i * (w - 12)) / (values.length - 1);
    const t = (v - min) / span;
    const y = 8 + (invert ? t : 1 - t) * (height - 16);
    return [x, y] as const;
  });
  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Line x1="0" y1={height - 1} x2={w} y2={height - 1} stroke={colors.hairline} strokeWidth="1" />
          <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (dots === 'all' || i === pts.length - 1 ? <Circle key={i} cx={p[0]} cy={p[1]} r="4" fill={c} /> : null))}
        </Svg>
      ) : null}
    </View>
  );
}

/* ───────────── Photos ───────────── */

/** A scan photo, or a skin-toned placeholder for seeded demo scans that have no image. */
export function ScanPhoto({
  uri,
  tone,
  label,
  style,
}: {
  uri?: string;
  tone: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const base = fitzpatrick[Math.max(0, Math.min(5, tone))];
  const deeper = fitzpatrick[Math.max(0, Math.min(5, tone + 1))];
  return (
    <View style={[{ borderRadius: radius.card, overflow: 'hidden', backgroundColor: base }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <LinearGradient colors={[base, deeper]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%' }} />
      )}
      {label ? (
        <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(14,42,51,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={[type.caption, { color: '#FFFFFF' }]}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Two photos with a draggable divider (D4, H3). */
export function PhotoCompare({
  before,
  after,
  height = 180,
}: {
  before: { uri?: string; tone: number; label: string };
  after: { uri?: string; tone: number; label: string };
  height?: number;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const [split, setSplit] = useState(0.5);
  const x = w * split;
  return (
    <View
      style={{ height, borderRadius: radius.card, overflow: 'hidden' }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        if (w) setSplit(Math.max(0.08, Math.min(0.92, e.nativeEvent.locationX / w)));
      }}
      onResponderMove={(e) => {
        if (w) setSplit(Math.max(0.08, Math.min(0.92, e.nativeEvent.locationX / w)));
      }}
      accessibilityLabel={`Compare ${before.label} with ${after.label}. Drag to move the divider.`}
      accessibilityRole="adjustable">
      <View pointerEvents="none" style={{ flex: 1 }}>
        <ScanPhoto uri={after.uri} tone={after.tone} style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: x, overflow: 'hidden' }}>
        <ScanPhoto uri={before.uri} tone={before.tone} style={{ width: w, height, borderRadius: 0 }} />
        </View>
        <View style={{ position: 'absolute', left: x - 1, top: 0, bottom: 0, width: 2, backgroundColor: '#FFFFFF' }} />
        <View style={{ position: 'absolute', left: x - 16, top: height / 2 - 16, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="code" size={18} color={colors.textPrimary} />
        </View>
        <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(14,42,51,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={[type.caption, { color: '#FFFFFF' }]}>{before.label}</Text>
        </View>
        <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(14,42,51,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={[type.caption, { color: '#FFFFFF' }]}>{after.label}</Text>
        </View>
      </View>
    </View>
  );
}

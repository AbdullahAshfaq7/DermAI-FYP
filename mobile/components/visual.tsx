import { Image } from 'expo-image';
import { LinearGradient as FadeGradient } from 'expo-linear-gradient';
import { useEffect, useId, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polyline, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/kit';
import logo from '@/assets/logo.json';
import { CONCERNS, ZONE_LABEL } from '@/data/seed';
import type { ConcernKey, ConcernLevel, ConcernReading, ZoneKey } from '@/data/types';
import { concernScale } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space, type } from '@/theme/tokens';

/* ───────────── Logo: a head in profile whose thoughts dissolve into skin-tone pixels ───────────── */

export function LogoMark({ size = 40 }: { size?: number; ring?: string }) {
  // Each mark gets its own gradient ids: a hidden copy elsewhere (the splash under a stack) would otherwise win the lookup.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const leafId = `dermaiLeaf${uid}`;
  const headId = `dermaiHead${uid}`;
  const g = (p: typeof logo.head, id: string) => (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={p.from[0]} y1={p.from[1]} x2={p.to[0]} y2={p.to[1]}>
      <Stop offset="0" stopColor={p.stops[0]} />
      <Stop offset="1" stopColor={p.stops[1]} />
    </LinearGradient>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="DermAI">
      <Defs>
        {g(logo.leaf, leafId)}
        {g(logo.head, headId)}
      </Defs>
      <Path d={logo.leaf.d} fill={`url(#${leafId})`} />
      <Path d={logo.head.d} fill={`url(#${headId})`} />
      {logo.squares.map((q) => (
        <Rect key={`${q.x}-${q.y}`} x={q.x} y={q.y} width={q.s} height={q.s} rx={q.s * 0.22} fill={q.fill} />
      ))}
    </Svg>
  );
}

/** "derm" in ink, "AI" in brand blue (always blue, even in the dermatologist's green theme). */
export function Wordmark({ size = 28, color, onDark, tagline, center }: { size?: number; color?: string; onDark?: boolean; tagline?: boolean; center?: boolean }) {
  const { colors, isDark } = useTheme();
  const dark = onDark ?? isDark;
  return (
    <View style={center ? { alignItems: 'center' } : undefined}>
      <Text style={{ fontFamily: fonts.display800, fontSize: size, lineHeight: size * 1.05, letterSpacing: -size * 0.04, color: color ?? colors.textPrimary }}>
        derm<Text style={{ color: dark ? '#6FA9F2' : '#2F67C9' }}>AI</Text>
      </Text>
      {tagline ? (
        <Text style={{ fontFamily: fonts.sans500, fontSize: Math.max(10, size * 0.42), letterSpacing: 0.2, color: dark ? '#A6B8D4' : colors.textSecondary }}>AI Skin Insights</Text>
      ) : null}
    </View>
  );
}

/* ───────────── Face map: a glowing dot face; zones swell and warm up as a concern grows ───────────── */

const ZONE_ORDER: ZoneKey[] = ['forehead', 'nose', 'leftCheek', 'rightCheek', 'chin'];
const LEVEL_N: Record<ConcernLevel, number> = { Clear: 0, Mild: 1, Moderate: 2, High: 3 };
/** Zone centre and spread in face units (-1..1). */
const ZONE_C: Record<ZoneKey, [number, number, number, number]> = {
  forehead: [0, -0.62, 0.55, 0.26],
  nose: [0, 0.1, 0.15, 0.3],
  leftCheek: [-0.52, 0.22, 0.28, 0.3],
  rightCheek: [0.52, 0.22, 0.28, 0.3],
  chin: [0, 0.8, 0.32, 0.2],
};
const hash = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const halfW = (ny: number) => {
  if (Math.abs(ny) >= 1) return 0;
  let w = Math.sqrt(1 - ny * ny);
  if (ny > 0.12) w *= 1 - 0.42 * (ny - 0.12);
  return w;
};
const hole = (nx: number, ny: number) => {
  const e = (x0: number, y0: number, a: number, b: number) => ((nx - x0) / a) ** 2 + ((ny - y0) / b) ** 2 < 1;
  return e(-0.4, -0.16, 0.19, 0.075) || e(0.4, -0.16, 0.19, 0.075) || e(0, 0.5, 0.27, 0.06);
};

type Dot = { x: number; y: number; r: number; color: string; a: number; glow: number };

function faceDots(w: number, h: number, zones: Record<ZoneKey, ConcernLevel> | null, density: number): Dot[] {
  let fh = h * 0.86;
  let fw = fh * 0.74;
  if (fw > w * 0.86) {
    fw = w * 0.86;
    fh = fw / 0.74;
  }
  const cx = w / 2;
  const cy = h / 2;
  const s = fw / density;
  const out: Dot[] = [];
  for (let y = cy - fh / 2 + s / 2; y < cy + fh / 2; y += s) {
    for (let x = cx - fw / 2 + s / 2; x < cx + fw / 2; x += s) {
      const nx = (x - cx) / (fw / 2);
      const ny = (y - cy) / (fh / 2);
      const hw = halfW(ny);
      if (Math.abs(nx) > hw || hole(nx, ny)) continue;
      const edge = Math.min(1, (1 - Math.abs(nx) / hw) * 4);
      const hv = hash(x, y);
      let color = '#B7D0F7';
      let rad = s * (0.17 + 0.07 * hv);
      let al = 0.5;
      let glow = 0;
      if (zones) {
        let best = 0;
        let L = -1;
        for (const z of ZONE_ORDER) {
          const [zx, zy, sx, sy] = ZONE_C[z];
          const lv = LEVEL_N[zones[z]];
          const wgt = Math.exp(-(((nx - zx) / sx) ** 2 + ((ny - zy) / sy) ** 2));
          const sc = wgt * (0.6 + (0.4 * lv) / 3);
          if (sc > best) {
            best = sc;
            L = lv;
          }
        }
        const wgt = best / (0.6 + (0.4 * Math.max(0, L)) / 3);
        if (L >= 0 && wgt > 0.18) {
          const k = Math.min(1, (wgt - 0.18) / 0.6);
          color = concernScale[(Object.keys(LEVEL_N) as ConcernLevel[])[L]];
          rad = s * (0.18 + (0.16 + 0.06 * L) * k + 0.05 * hv);
          al = 0.6 + 0.4 * k;
          glow = L > 0 ? (3 + 2 * L) * k : 2;
        }
      }
      out.push({ x, y, r: Math.max(0.6, rad), color, a: Math.min(1, al * (0.55 + 0.45 * edge)), glow });
    }
  }
  return out;
}

export function FaceMap({
  zones,
  width = 160,
  height: heightProp,
  onZonePress,
  selected,
  concernLabel,
  density = 24,
}: {
  zones: Record<ZoneKey, ConcernLevel> | null;
  width?: number;
  height?: number;
  onZonePress?: (zone: ZoneKey) => void;
  selected?: ZoneKey | null;
  animate?: boolean;
  concernLabel?: string;
  /** Dots across the face; fewer for small maps. */
  density?: number;
}) {
  const height = heightProp ?? (width * 200) / 160;
  const dots = useMemo(() => faceDots(width, height, zones, density), [width, height, zones, density]);
  // Face box, to place tap targets over each zone.
  let fh = height * 0.86;
  let fw = fh * 0.74;
  if (fw > width * 0.86) {
    fw = width * 0.86;
    fh = fw / 0.74;
  }
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {dots.map((d, i) =>
          d.glow ? (
            <G key={i}>
              <Circle cx={d.x} cy={d.y} r={d.r + d.glow * 0.6} fill={d.color} opacity={d.a * 0.25} />
              <Circle cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.a} />
            </G>
          ) : (
            <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.a} />
          ),
        )}
        {selected ? (
          <Ellipse
            cx={width / 2 + (ZONE_C[selected][0] * fw) / 2}
            cy={height / 2 + (ZONE_C[selected][1] * fh) / 2}
            rx={(ZONE_C[selected][2] * fw) / 2 + 6}
            ry={(ZONE_C[selected][3] * fh) / 2 + 6}
            stroke="#EAF2FF"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
          />
        ) : null}
      </Svg>
      {zones && onZonePress
        ? ZONE_ORDER.map((z) => {
            const [zx, zy, sx, sy] = ZONE_C[z];
            const bw = Math.max(36, sx * fw);
            const bh = Math.max(32, sy * fh);
            return (
              <Pressable
                key={z}
                onPress={() => onZonePress(z)}
                accessibilityRole="button"
                accessibilityLabel={`${ZONE_LABEL[z][0].toUpperCase()}${ZONE_LABEL[z].slice(1)}, ${concernLabel ? `${concernLabel} ` : ''}${zones[z].toLowerCase()}`}
                style={{ position: 'absolute', left: width / 2 + (zx * fw) / 2 - bw / 2, top: height / 2 + (zy * fh) / 2 - bh / 2, width: bw, height: bh }}
              />
            );
          })
        : null}
    </View>
  );
}

/** A small label pinned on the night map: "T-zone, moderate". */
export function MapTag({ label, level, style }: { label: string; level: ConcernLevel; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, height: 24, paddingLeft: 7, paddingRight: 9, borderRadius: 99, backgroundColor: 'rgba(21,37,64,0.92)' }, style]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: concernScale[level] }} />
      <Text style={[type.caption, { color: '#EAF2FF', fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

/** A glowing violet line that sweeps the face while the scan is analysed. */
export function ScanSweep({ height, width }: { height: number; width: number }) {
  const [y] = useState(() => new Animated.Value(height * 0.08));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(y, { toValue: height * 0.9, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: height * 0.08, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [height, y]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: width * 0.1, width: width * 0.8, top: -24, height: 26, transform: [{ translateY: y }] }}>
      <FadeGradient colors={['rgba(79,139,234,0)', 'rgba(79,139,234,0.32)']} style={{ flex: 1 }} />
      <View style={{ height: 2, borderRadius: 1, backgroundColor: '#CFE1FA', boxShadow: '0 0 10px #5AB4E0' } as ViewStyle} />
    </Animated.View>
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
    <View style={{ height: 6, borderRadius: 9, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${reading.pct}%`, height: '100%', borderRadius: 9, backgroundColor: concernScale[reading.level] }} />
    </View>
  );
}

/** A glowing dot in the concern colour (Night screens). */
export function LevelDot({ level, size = 9 }: { level: ConcernLevel; size?: number }) {
  const c = concernScale[level];
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, boxShadow: `0 0 8px ${c}` } as ViewStyle} />;
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
          {pts.length > 1 ? (
            <Path d={`M${pts[0][0]} ${height - 2} ${pts.map((p) => `L${p[0]} ${p[1]}`).join(' ')} L${pts[pts.length - 1][0]} ${height - 2} Z`} fill={colors.brandWash} />
          ) : null}
          <Line x1="0" y1={height - 1} x2={w} y2={height - 1} stroke={colors.hairline} strokeWidth="1" />
          <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) =>
            i === pts.length - 1 ? (
              <Circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill={c} />
            ) : dots === 'all' ? (
              <Circle key={i} cx={p[0]} cy={p[1]} r="3" fill={colors.surface} stroke={c} strokeWidth="2" />
            ) : null,
          )}
        </Svg>
      ) : null}
    </View>
  );
}

/* ───────────── Photos ───────────── */

/** A scan photo, or a soft brand-coloured placeholder for seeded demo scans that have no image. */
export function ScanPhoto({
  uri,
  label,
  style,
}: {
  uri?: string | null;
  /** Accepted for older callers; the placeholder no longer uses skin tones. */
  tone?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const base = colors.brandWash;
  const deeper = colors.brandSoft;
  return (
    <View style={[{ borderRadius: radius.card, overflow: 'hidden', backgroundColor: base }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <FadeGradient colors={[base, deeper]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%' }} />
      )}
      {label ? (
        <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(21,37,64,0.9)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
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
  before: { uri?: string | null; tone: number; label: string };
  after: { uri?: string | null; tone: number; label: string };
  height?: number;
}) {
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
        <View style={{ position: 'absolute', left: x - 16, top: height / 2 - 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="code" size={18} color="#14233D" />
        </View>
        <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(21,37,64,0.9)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={[type.caption, { color: '#FFFFFF' }]}>{before.label}</Text>
        </View>
        <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(21,37,64,0.9)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={[type.caption, { color: '#FFFFFF' }]}>{after.label}</Text>
        </View>
      </View>
    </View>
  );
}

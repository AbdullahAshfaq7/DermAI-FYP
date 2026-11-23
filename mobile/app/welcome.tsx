import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Card, Screen, Txt, shadow } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import type { Role } from '@/data/types';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const FACE = require('../assets/images/welcome-face.jpg');
const PHOTO_W = 148;
const PHOTO_H = 178;
const FRAME = '#7B63FF';

/** Where the scan dots sit on the photo, as fractions of its width and height. */
const DOTS = [
  { x: 0.5, y: 0.2 },
  { x: 0.5, y: 0.56 },
  { x: 0.27, y: 0.62 },
  { x: 0.73, y: 0.62 },
  { x: 0.52, y: 0.88 },
];

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'auto-awesome', text: 'Advanced AI' },
  { icon: 'verified-user', text: 'Private & Secure' },
  { icon: 'stethoscope', text: 'Dermatology Guided' },
];

/** The face with a scan frame and dots over it, so people see what a scan feels like. */
function ScanPhoto() {
  const L = 22; // bracket length
  const i = 9; // inset from the edge
  const bracket = (x: number, y: number, dx: number, dy: number) => `M${x} ${y + dy * L}V${y}H${x + dx * L}`;
  return (
    <View style={{ width: PHOTO_W, height: PHOTO_H, borderRadius: 26, overflow: 'hidden' }} accessibilityLabel="A face being scanned" accessibilityRole="image">
      <Image source={FACE} style={{ width: PHOTO_W, height: PHOTO_H }} contentFit="cover" contentPosition="top" />
      <Svg width={PHOTO_W} height={PHOTO_H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Path d={bracket(i, i, 1, 1)} stroke={FRAME} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <Path d={bracket(PHOTO_W - i, i, -1, 1)} stroke={FRAME} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <Path d={bracket(i, PHOTO_H - i, 1, -1)} stroke={FRAME} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <Path d={bracket(PHOTO_W - i, PHOTO_H - i, -1, -1)} stroke={FRAME} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      </Svg>
      {DOTS.map((d, n) => (
        <View
          key={n}
          style={{ position: 'absolute', left: d.x * PHOTO_W - 7, top: d.y * PHOTO_H - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: FRAME }} />
        </View>
      ))}
    </View>
  );
}

function Option({ icon, title, body, clinician, onPress }: { icon: IconName; title: string; body: string; clinician?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.md + 2, borderWidth: 1.5, borderColor: pressed ? (clinician ? colors.clinician : colors.brand) : 'transparent' },
        shadow(colors),
      ]}>
      <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: clinician ? colors.clinicianWash : colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={clinician ? colors.clinicianDeep : colors.brandDeep} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="heading">{title}</Txt>
        <Txt variant="small" color="secondary">
          {body}
        </Txt>
      </View>
      <Icon name="chevron-right" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

/** A2 Welcome: what DermAI does, then straight into patient or dermatologist sign-up. */
export default function Welcome() {
  const { colors } = useTheme();
  const { chooseRole } = useActions();
  const go = (role: Role) => {
    chooseRole(role);
    router.push('/sign-up');
  };
  return (
    <Screen
      footer={
        <>
          <Txt variant="small" color="secondary" align="center">
            Already have an account?{' '}
            <Txt variant="smallStrong" color="brand" onPress={() => router.push('/log-in')}>
              Log in
            </Txt>
          </Txt>
          <Pressable
            onPress={() => router.push('/admin-login')}
            accessibilityRole="button"
            accessibilityLabel="Log in as admin"
            hitSlop={8}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.6 : 1 })}>
            <Icon name="admin-panel-settings" size={16} color={colors.textMuted} />
            <Txt variant="smallStrong" color="muted">
              Log in as admin
            </Txt>
          </Pressable>
        </>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <LogoMark size={44} />
        <Wordmark size={28} tagline />
      </View>

      <Card tone="brand" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: radius.sheet }}>
        <View style={{ flex: 1, gap: space.sm }}>
          <Txt variant="title">Smart scan. Real insights.</Txt>
          <Txt variant="small" color="secondary">
            AI-powered analysis of your skin health in seconds.
          </Txt>
          <View style={{ gap: space.sm, marginTop: space.xs }}>
            {POINTS.map((p) => (
              <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={p.icon} size={16} color={colors.brand} />
                </View>
                <Txt variant="smallStrong" style={{ flex: 1 }}>
                  {p.text}
                </Txt>
              </View>
            ))}
          </View>
        </View>
        <ScanPhoto />
      </Card>

      <Txt variant="heading" style={{ marginTop: space.sm }}>
        How will you use DermAI?
      </Txt>
      <Option icon="face" title="I'm here for my skin" body="Scan, follow a routine, book a dermatologist." onPress={() => go('patient')} />
      <Option icon="stethoscope" clinician title="I'm a dermatologist" body="Review cases and run bookings. Needs a PMDC registration." onPress={() => go('dermatologist')} />
    </Screen>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Button, Txt, shadow } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import type { Role } from '@/data/types';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** Small result cards floating around the mark: a glimpse of what a scan gives you. */
const CHIPS: { icon: IconName; label: string; value: string; tone: 'brand' | 'good' | 'peach'; pos: ViewStyle }[] = [
  { icon: 'water-drop', label: 'Acne', value: 'Mild', tone: 'brand', pos: { top: '16%', left: space.screen } },
  { icon: 'spa', label: 'Routine', value: 'Ready', tone: 'good', pos: { top: '30%', right: space.screen } },
  { icon: 'verified', label: 'Doctors', value: 'PMDC verified', tone: 'peach', pos: { bottom: '13%', left: space.screen + 12 } },
];

function Chip({ icon, label, value, tone, pos }: (typeof CHIPS)[number]) {
  const { colors } = useTheme();
  const fg = tone === 'good' ? colors.good : tone === 'peach' ? colors.peachDeep : colors.brand;
  const bg = tone === 'good' ? colors.goodWash : tone === 'peach' ? colors.peachWash : colors.brandWash;
  return (
    <View
      style={[
        { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.full, paddingVertical: 7, paddingLeft: 7, paddingRight: 14 },
        shadow(colors),
        pos,
      ]}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={fg} />
      </View>
      <View>
        <Txt variant="caption" color="muted">
          {label}
        </Txt>
        <Txt variant="smallStrong">{value}</Txt>
      </View>
    </View>
  );
}

/** A2 Welcome: a branded hero, one clear way in for patients, log in, and a separate door for doctors. */
export default function Welcome() {
  const { colors, isDark } = useTheme();
  const { chooseRole } = useActions();
  const insets = useSafeAreaInsets();
  const go = (role: Role) => {
    chooseRole(role);
    router.push('/sign-up');
  };
  const wash = isDark ? [colors.brandWash, colors.bg] : [colors.brandWash, '#DDF1F3'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Hero */}
      <LinearGradient
        colors={wash as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: insets.top + space.sm, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: space.screen, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <LogoMark size={30} />
          <Wordmark size={22} />
        </View>

        {/* Soft rings behind the mark */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: colors.brandSoft, opacity: 0.6 }} />
          <View style={{ position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: colors.brandSoft }} />
          <View
            style={[
              { width: 132, height: 132, borderRadius: 66, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
              shadow(colors, true),
            ]}>
            <LogoMark size={84} />
          </View>
          {CHIPS.map((c) => (
            <Chip key={c.label} {...c} />
          ))}
        </View>
      </LinearGradient>

      {/* Copy and actions */}
      <View style={{ paddingHorizontal: space.screen, paddingTop: space.xl, paddingBottom: insets.bottom + space.md, gap: space.md }}>
        <View style={{ gap: space.sm }}>
          <Txt variant="display">Know your skin.{'\n'}Care for it better.</Txt>
          <Txt variant="body" color="secondary">
            A 30-second AI skin scan, a routine built for you, and dermatologists when you need one.
          </Txt>
        </View>

        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button label="Get started" onPress={() => go('patient')} />
          <Button label="I already have an account" variant="secondary" onPress={() => router.push('/log-in')} />
        </View>

        <Pressable
          onPress={() => go('dermatologist')}
          accessibilityRole="button"
          accessibilityLabel="Join as a dermatologist"
          hitSlop={6}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.xs, opacity: pressed ? 0.6 : 1 })}>
          <Icon name="stethoscope" size={16} color={colors.clinician} />
          <Txt variant="small" color="secondary">
            Are you a dermatologist?{' '}
            <Txt variant="smallStrong" style={{ color: colors.clinician }}>
              Join as a doctor
            </Txt>
          </Txt>
        </Pressable>

        <Txt variant="caption" color="muted" align="center">
          DermAI gives guidance, not a diagnosis.{'  '}
          <Txt variant="caption" color="muted" onPress={() => router.push('/admin-login')}>
            Staff log in
          </Txt>
        </Txt>
      </View>
    </View>
  );
}

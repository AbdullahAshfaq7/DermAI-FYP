import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Screen, Txt } from '@/components/ui/kit';
import { FaceMap, LogoMark } from '@/components/visual';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** A2 Welcome */
export default function Welcome() {
  const { colors } = useTheme();
  const tag = (icon: 'water-drop' | 'blur-on', text: string, style: object) => (
    <View
      style={[
        { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
        style,
      ]}>
      <Icon name={icon} size={16} color={icon === 'blur-on' ? colors.actIcon : colors.brandDeep} />
      <Txt variant="small">{text}</Txt>
    </View>
  );
  return (
    <Screen
      footer={
        <>
          <Button label="Get started" onPress={() => router.push('/role')} />
          <Txt variant="small" color="secondary" align="center">
            Already have an account?{' '}
            <Txt variant="smallStrong" onPress={() => router.push('/log-in')}>
              Log in
            </Txt>
          </Txt>
        </>
      }>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm }}>
        <LogoMark size={36} />
        <Txt variant="small" color="secondary" onPress={() => router.push('/log-in')}>
          Log in
        </Txt>
      </View>
      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sheet, height: 280, alignItems: 'center', justifyContent: 'center' }}>
        <FaceMap zones={{ forehead: 'Mild', nose: 'Moderate', leftCheek: 'Moderate', rightCheek: 'Mild', chin: 'Clear' }} width={150} />
        {tag('water-drop', 'Hydration 64', { top: 18, left: 18 })}
        {tag('blur-on', 'Redness on cheeks', { bottom: 18, right: 18 })}
      </View>
      <Txt variant="display">Know your skin before you follow a trend.</Txt>
      <Txt variant="body" color="secondary">
        Scan your face in good light, get a clear read on six concerns, and a routine built for your skin type.
      </Txt>
    </Screen>
  );
}

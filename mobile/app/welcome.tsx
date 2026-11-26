import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Txt } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import type { Role } from '@/data/types';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** A2 Welcome: the mark, one line, and two ways in. Doctors and staff have quiet links below. */
export default function Welcome() {
  const { colors } = useTheme();
  const { chooseRole } = useActions();
  const insets = useSafeAreaInsets();
  const go = (role: Role) => {
    chooseRole(role);
    router.push('/sign-up');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + space.md, paddingHorizontal: space.screen }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <LogoMark size={96} />
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <Wordmark size={40} center />
          <Txt variant="body" color="secondary" align="center">
            Every skin, seen clearly.
          </Txt>
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Button label="Get started" onPress={() => go('patient')} />
        <Button label="Log in" variant="secondary" onPress={() => router.push('/log-in')} />
        <Txt variant="small" color="secondary" align="center" style={{ marginTop: space.sm }}>
          Dermatologist?{' '}
          <Txt variant="smallStrong" style={{ color: colors.clinician }} onPress={() => go('dermatologist')}>
            Join here
          </Txt>
          <Txt variant="small" color="muted">
            {'   ·   '}
          </Txt>
          <Txt variant="small" color="muted" onPress={() => router.push('/admin-login')}>
            Staff log in
          </Txt>
        </Txt>
      </View>
    </View>
  );
}

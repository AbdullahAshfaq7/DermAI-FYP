import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Button, Screen, TopBar, Txt, shadow } from '@/components/ui/kit';
import type { Role } from '@/data/types';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function RoleCard({ icon, title, body, selected, onPress, clinician }: { icon: IconName; title: string; body: string; selected: boolean; onPress: () => void; clinician?: boolean }) {
  const { colors } = useTheme();
  const accent = clinician ? colors.clinician : colors.brand;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${body}`}
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, gap: space.md, borderWidth: 2, borderColor: selected ? accent : 'transparent' },
        shadow(colors),
      ]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: clinician ? colors.clinicianWash : colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} color={clinician ? colors.clinicianDeep : colors.brandDeep} />
        </View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: selected ? 6.5 : 1.5, borderColor: selected ? accent : colors.textMuted }} />
      </View>
      <View style={{ gap: 3 }}>
        <Txt variant="heading">{title}</Txt>
        <Txt variant="small" color="secondary">
          {body}
        </Txt>
      </View>
    </Pressable>
  );
}

/** A3 Choose role: the button names the choice. */
export default function ChooseRole() {
  const { pendingRole } = useApp();
  const { chooseRole } = useActions();
  const [role, setRole] = useState<Role | null>(pendingRole);
  return (
    <Screen
      header={<TopBar right={<Txt variant="small" color="secondary">1 of 3</Txt>} />}
      footer={
        <Button
          label={role === 'dermatologist' ? 'Continue as dermatologist' : role === 'patient' ? 'Continue as patient' : 'Choose one'}
          variant={role === 'dermatologist' ? 'clinician' : 'primary'}
          disabled={!role}
          onPress={() => {
            if (!role) return;
            chooseRole(role);
            router.push('/sign-up');
          }}
        />
      }>
      <Txt variant="display">Who&apos;s joining?</Txt>
      <Txt variant="body" color="secondary">
        You can&apos;t switch later without a new account.
      </Txt>
      <RoleCard icon="face" title="I'm here for my skin" body="Scan, follow a routine, book a dermatologist." selected={role === 'patient'} onPress={() => setRole('patient')} />
      <RoleCard
        icon="stethoscope"
        clinician
        title="I'm a dermatologist"
        body="Review cases and run bookings. Needs a PMDC registration."
        selected={role === 'dermatologist'}
        onPress={() => setRole('dermatologist')}
      />
    </Screen>
  );
}

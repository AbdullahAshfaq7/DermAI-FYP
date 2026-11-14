import { router } from 'expo-router';
import { useState } from 'react';

import { Button, OptionCard, Screen, TopBar, Txt } from '@/components/ui/kit';
import type { Role } from '@/data/types';
import { useActions, useApp } from '@/store/AppStore';

/** A3 Choose role */
export default function ChooseRole() {
  const { pendingRole } = useApp();
  const { chooseRole } = useActions();
  const [role, setRole] = useState<Role | null>(pendingRole);
  return (
    <Screen
      header={<TopBar right={<Txt variant="small" color="secondary">1 of 3</Txt>} />}
      footer={
        <Button
          label="Continue"
          disabled={!role}
          onPress={() => {
            if (!role) return;
            chooseRole(role);
            router.push('/sign-up');
          }}
        />
      }>
      <Txt variant="display">How will you use DermAI?</Txt>
      <Txt variant="body" color="secondary">
        You can&apos;t switch roles later without a new account.
      </Txt>
      <OptionCard
        icon="face"
        title="For my own skin"
        subtitle="Scan, track progress, follow a routine and reach a dermatologist when you need one."
        selected={role === 'patient'}
        onPress={() => setRole('patient')}
      />
      <OptionCard
        icon="stethoscope"
        tone="clinician"
        title="I'm a dermatologist"
        subtitle="Review referred cases, message patients and manage bookings. PMDC registration required."
        selected={role === 'dermatologist'}
        onPress={() => setRole('dermatologist')}
      />
    </Screen>
  );
}

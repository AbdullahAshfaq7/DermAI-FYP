import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Icon } from '@/components/ui/Icon';
import { Banner, Button, IconTile, List, Screen, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import type { ServiceType } from '@/data/types';
import { back } from '@/lib/nav';
import { useStore } from '@/store/AppStore';
import type { DermProfile } from '@/store/state';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

const DETAIL: Record<ServiceType, string> = { video: '20 min', clinic: '30 min', message: 'Reply within 24 h' };

/** G2 Services and review status. Also "Services and fees" from H8. */
export default function Services() {
  const { colors } = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { state, update } = useStore();
  const [services, setServices] = useState<DermProfile['services']>(state.derm.services);
  const pending = state.derm.status !== 'approved';

  const set = (t: ServiceType, patch: Partial<{ on: boolean; fee: number }>) => setServices((s) => ({ ...s, [t]: { ...s[t], ...patch } }));
  const anyOn = Object.values(services).some((x) => x.on && x.fee > 0);

  const save = () => {
    update((s) => ({ ...s, derm: { ...s.derm, services, step: 'done', status: s.derm.status === 'draft' ? 'pending' : s.derm.status } }));
    if (edit) back();
    else {
      router.replace('/today');
      router.push('/availability');
    }
  };

  return (
    <Screen
      keyboard
      header={<SetupHeader step={3} tone="clinician" editing={!!edit} label={edit ? undefined : 'Step 3 of 3'} />}
      footer={<Button label={edit ? 'Save' : 'Set my hours'} variant="clinician" disabled={!anyOn} onPress={save} />}>
      <Txt variant="display">{edit ? 'Services and fees' : 'Set how patients can reach you'}</Txt>
      <List>
        {(Object.keys(SERVICE_META) as ServiceType[]).map((t) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, opacity: services[t].on ? 1 : 0.55 }}>
            <IconTile icon={SERVICE_META[t].icon} tone="clinician" />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="bodyStrong">{SERVICE_META[t].title}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt variant="small" color="secondary">
                  {DETAIL[t]} · PKR
                </Txt>
                <TextInput
                  value={services[t].fee ? String(services[t].fee) : ''}
                  onChangeText={(v) => set(t, { fee: Number(v.replace(/\D/g, '')) || 0 })}
                  keyboardType="number-pad"
                  editable={services[t].on}
                  accessibilityLabel={`${SERVICE_META[t].title} fee in rupees`}
                  style={[type.smallStrong, { minWidth: 64, color: colors.textPrimary, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 2 }]}
                />
              </View>
            </View>
            <Switch
              value={services[t].on}
              onValueChange={(v) => set(t, { on: v })}
              accessibilityLabel={`Offer ${SERVICE_META[t].title}`}
              trackColor={{ true: colors.clinician, false: colors.surfaceMuted }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </List>
      {pending ? (
        <View style={{ flexDirection: 'row', gap: space.md, backgroundColor: colors.clinicianWash, borderRadius: radius.card, padding: space.lg }}>
          <Icon name="hourglass-top" size={22} color={colors.clinician} />
          <Txt variant="small" color="clinician" style={{ flex: 1 }}>
            We check PMDC records within 2 working days. You can set up your schedule meanwhile; patients see you once approved.
          </Txt>
        </View>
      ) : (
        <Banner tone="clinician" icon="verified" text="You're verified. Fee changes apply to new bookings only." />
      )}
    </Screen>
  );
}

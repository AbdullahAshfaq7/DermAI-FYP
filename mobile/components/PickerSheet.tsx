import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/kit';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export interface PickerOption {
  label: string;
  onPress: () => void;
  selected?: boolean;
  destructive?: boolean;
  subtitle?: string;
}

interface Open {
  title: string;
  message?: string;
  options: PickerOption[];
}

/**
 * A bottom-sheet list of choices. Alert.alert shows at most three buttons on Android,
 * so any picker with more options uses this instead.
 *
 *   const [sheet, pick] = usePicker();
 *   pick('Sort by', [{ label: 'Highest rated', onPress: ... }]);
 *   return <>{...}{sheet}</>;
 */
export function usePicker(): [ReactNode, (title: string, options: PickerOption[], message?: string) => void] {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<Open | null>(null);
  const show = useCallback((title: string, options: PickerOption[], message?: string) => setOpen({ title, options, message }), []);
  const close = () => setOpen(null);

  const sheet = (
    <Modal visible={!!open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={close} accessibilityLabel="Close" accessibilityRole="button" />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: space.lg,
          paddingBottom: insets.bottom + space.md,
          maxHeight: '75%',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        }}
        accessibilityViewIsModal>
        <View style={{ paddingHorizontal: space.screen, gap: 4, paddingBottom: space.sm }}>
          <Txt variant="heading">{open?.title}</Txt>
          {open?.message ? (
            <Txt variant="small" color="secondary">
              {open.message}
            </Txt>
          ) : null}
        </View>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
          {open?.options.map((o, i) => (
            <Pressable
              key={`${i}-${o.label}`}
              onPress={() => {
                close();
                o.onPress();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: !!o.selected }}
              style={({ pressed }) => ({
                minHeight: 52,
                paddingHorizontal: space.screen,
                paddingVertical: space.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
              })}>
              <View style={{ flex: 1 }}>
                <Txt variant={o.selected ? 'bodyStrong' : 'body'} color={o.destructive ? 'act' : 'primary'}>
                  {o.label}
                </Txt>
                {o.subtitle ? (
                  <Txt variant="small" color="secondary">
                    {o.subtitle}
                  </Txt>
                ) : null}
              </View>
              {o.selected ? <Icon name="check" size={20} color={colors.brand} /> : null}
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: space.xs }}>
          <Txt variant="bodyStrong" color="secondary">
            Cancel
          </Txt>
        </Pressable>
      </View>
    </Modal>
  );
  return [sheet, show];
}

import { ReactNode, useMemo } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface AppScreenProps {
  children: ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  scrollViewStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;
  padded?: boolean;
}

export function AppScreen({
  children,
  edges = ['top'],
  scroll = false,
  contentContainerStyle,
  style,
  scrollViewStyle,
  scrollProps,
  padded = true,
}: AppScreenProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeArea: {
          flex: 1,
        },
        content: {
          paddingHorizontal: padded ? spacing.lg : 0,
        },
      }),
    [colors.background, padded],
  );

  const content = scroll ? (
    <ScrollView
      {...scrollProps}
      style={[styles.safeArea, scrollViewStyle]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={scrollProps?.showsVerticalScrollIndicator ?? false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.safeArea, styles.content, contentContainerStyle, style]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {content}
      </SafeAreaView>
    </View>
  );
}

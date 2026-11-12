import { CHAT_MESSAGES, SUGGESTION_CHIPS } from '@/data/homeMockData';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function DermAIChatPreview() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          marginTop: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        aiIcon: {
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: typography.subtitle,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        expandButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        messages: {
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        bubble: {
          maxWidth: '88%',
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
        },
        userBubble: {
          alignSelf: 'flex-end',
          backgroundColor: colors.primary,
          borderBottomRightRadius: spacing.xs,
        },
        aiBubble: {
          alignSelf: 'flex-start',
          backgroundColor: colors.primarySoft,
          borderBottomLeftRadius: spacing.xs,
        },
        bubbleText: {
          fontSize: typography.body,
          lineHeight: 20,
        },
        userBubbleText: {
          color: colors.textInverse,
        },
        aiBubbleText: {
          color: colors.textPrimary,
        },
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        chip: {
          backgroundColor: colors.infoSoft,
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          minHeight: 36,
          justifyContent: 'center',
        },
        chipText: {
          fontSize: typography.caption,
          color: colors.primary,
          fontWeight: '500',
        },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        inputField: {
          flex: 1,
          backgroundColor: colors.background,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          minHeight: 44,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.divider,
        },
        inputPlaceholder: {
          fontSize: typography.body,
          color: colors.textMuted,
        },
        sendButton: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.divider,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [colors, isDark],
  );

  const handleExpand = () => {
    router.push('/(tabs)/chat');
  };

  const handleChip = (chip: string) => {
    router.push('/(tabs)/chat');
  };

  const handleInput = () => {
    router.push('/(tabs)/chat');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={18} color={colors.info} />
          </View>
          <Text style={styles.title}>Ask dermAI</Text>
        </View>
        <Pressable
          onPress={handleExpand}
          accessibilityRole="button"
          accessibilityLabel="Expand chat"
          hitSlop={8}
          style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}>
          <Ionicons name="expand-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.messages}>
        {CHAT_MESSAGES.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}>
            <Text
              style={[
                styles.bubbleText,
                message.role === 'user' ? styles.userBubbleText : styles.aiBubbleText,
              ]}>
              {message.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.chips}>
        {SUGGESTION_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => handleChip(chip)}
            accessibilityRole="button"
            accessibilityLabel={chip}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleInput}
        accessibilityRole="button"
        accessibilityLabel="Ask anything about your skin"
        style={({ pressed }) => [styles.inputRow, pressed && styles.pressed]}>
        <View style={styles.inputField}>
          <Text style={styles.inputPlaceholder} numberOfLines={1}>
            Ask anything about your skin...
          </Text>
        </View>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={16} color={colors.iconMuted} />
        </View>
      </Pressable>
    </View>
  );
}

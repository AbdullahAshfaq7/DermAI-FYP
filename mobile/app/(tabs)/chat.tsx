import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavPadding } from '@/components/navigation/useBottomNavPadding';
import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { CHAT_MESSAGES, SUGGESTION_CHIPS } from '@/data/homeMockData';
import { createShadowStyle } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

function createChatStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  isDark: boolean,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    aiIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    messages: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
    },
    bubble: {
      maxWidth: '85%',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 4,
      borderRadius: RADIUS.lg,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: SPACING.xs,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderBottomLeftRadius: SPACING.xs,
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
    },
    bubbleText: {
      fontSize: FONT.body,
      lineHeight: 20,
    },
    userBubbleText: {
      color: colors.textInverse,
    },
    aiBubbleText: {
      color: colors.textPrimary,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    chips: {
      gap: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
    chip: {
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      fontSize: FONT.caption,
      color: colors.primary,
      fontWeight: '500',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    inputField: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 8,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    inputPlaceholder: {
      fontSize: FONT.body,
      color: colors.textMuted,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

export default function ChatScreen() {
  const { colors, isDark } = useAppTheme();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollBottomPadding = useBottomNavPadding();
  const footerBottomPadding = useBottomNavPadding(0);
  const styles = useMemo(() => createChatStyles(colors, isDark), [colors, isDark]);

  const addMessage = (role: 'user' | 'ai', text: string) => {
    setMessages((current) => [
      ...current,
      { id: `${role}-${Date.now()}`, role, text },
    ]);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const getAIResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();

    if (lower.includes('redness')) {
      return 'Redness can be soothed with calming products and gentle hydration.';
    }
    if (lower.includes('dry') || lower.includes('hydration')) {
      return 'Try adding a lightweight humectant serum to help replenish moisture.';
    }
    if (lower.includes('acne') || lower.includes('breakout')) {
      return 'A consistent cleansing routine can help manage moderate acne concerns.';
    }
    if (lower.includes('routine')) {
      return 'A simple routine with cleanser, moisturizer, and SPF is a great foundation.';
    }
    return 'I recommend focusing on hydration, sun protection, and calming ingredients first.';
  };

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return;
    }

    addMessage('user', trimmed);
    setMessageText('');
    setIsTyping(true);
    scrollToBottom();

    setTimeout(() => {
      addMessage('ai', getAIResponse(trimmed));
      setIsTyping(false);
      scrollToBottom();
    }, 700);
  };

  const handleChip = (chip: string) => {
    addMessage('user', chip);
    setIsTyping(true);
    scrollToBottom();

    setTimeout(() => {
      addMessage('ai', getAIResponse(chip));
      setIsTyping(false);
      scrollToBottom();
    }, 700);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>Ask dermAI</Text>
              <Text style={styles.subtitle}>Your AI dermatology assistant</Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.messages, { paddingBottom: scrollBottomPadding + 80 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}>
          {messages.map((message) => (
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
          {isTyping ? (
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={[styles.bubbleText, styles.aiBubbleText]}>dermAI is typing...</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Ask anything about your skin..."
              placeholderTextColor={colors.textMuted}
              style={styles.inputField}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}> 
              <Ionicons name="send" size={18} color={colors.textInverse} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

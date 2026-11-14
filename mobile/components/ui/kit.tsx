import { router } from 'expo-router';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { fitzpatrick, type ConcernLevel, type ThemeColors } from '@/theme/colors';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { hitTarget, radius, space, type, type TypeVariant } from '@/theme/tokens';

/* ───────────────────────── Text ───────────────────────── */

type TextColor =
  | 'primary' | 'secondary' | 'muted' | 'brand' | 'brandDeep' | 'clinician'
  | 'good' | 'watch' | 'act' | 'onFill' | 'onInk';

function textColor(c: ThemeColors, color: TextColor): string {
  switch (color) {
    case 'primary': return c.textPrimary;
    case 'secondary': return c.textSecondary;
    case 'muted': return c.textMuted;
    case 'brand': return c.brand;
    case 'brandDeep': return c.brandDeep;
    case 'clinician': return c.clinician;
    case 'good': return c.good;
    case 'watch': return c.watch;
    case 'act': return c.act;
    case 'onFill': return c.onFill;
    case 'onInk': return c.onInk;
  }
}

export function Txt({
  variant = 'body',
  color = 'primary',
  align,
  style,
  numberOfLines,
  children,
  onPress,
}: {
  variant?: TypeVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      numberOfLines={numberOfLines}
      style={[type[variant], { color: textColor(colors, color), textAlign: align }, style]}>
      {children}
    </Text>
  );
}

/* ───────────────────────── Layout ───────────────────────── */

export function Screen({
  children,
  scroll = true,
  header,
  footer,
  edges = ['top'],
  padded = true,
  keyboard = false,
  contentStyle,
  bg,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bg?: string;
}) {
  const { colors } = useTheme();
  // Hook insets instead of SafeAreaView: SafeAreaView reads zero inside iOS full-screen modals.
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = padded ? { paddingHorizontal: space.screen } : {};
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[pad, { paddingBottom: space.xl, gap: space.lg }, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
  );
  const inner = (
    <>
      {header}
      <View style={{ flex: 1 }}>{body}</View>
      {footer ? (
        <View style={{ paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: space.md, gap: space.sm }}>
          {footer}
        </View>
      ) : null}
    </>
  );
  const used = footer ? [...edges, 'bottom'] : edges;
  const pads: ViewStyle = {
    paddingTop: used.includes('top') ? insets.top : 0,
    paddingBottom: used.includes('bottom') ? insets.bottom : 0,
  };
  return (
    <View style={[{ flex: 1, backgroundColor: bg ?? colors.bg }, pads]}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </View>
  );
}

export function TopBar({
  left = 'back',
  title,
  right,
  onLeft,
  dark,
}: {
  left?: 'back' | 'close' | 'none' | ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  onLeft?: () => void;
  dark?: boolean;
}) {
  const handle = onLeft ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  let leftNode: ReactNode = <View style={{ width: hitTarget }} />;
  if (left === 'back') leftNode = <IconButton icon="arrow-back" label="Go back" onPress={handle} variant={dark ? 'dark' : 'surface'} />;
  else if (left === 'close') leftNode = <IconButton icon="close" label="Close" onPress={handle} variant={dark ? 'dark' : 'surface'} />;
  else if (left !== 'none') leftNode = left;
  return (
    <View style={styles.topBar}>
      {leftNode}
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: space.sm }}>
        {typeof title === 'string' ? (
          <Txt variant="heading" color={dark ? 'onFill' : 'primary'} numberOfLines={1}>
            {title}
          </Txt>
        ) : (
          title
        )}
      </View>
      <View style={{ minWidth: hitTarget, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'surface',
  color,
  badge,
  size = 20,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'surface' | 'plain' | 'dark';
  color?: string;
  badge?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  const bg = variant === 'surface' ? colors.surface : variant === 'dark' ? 'rgba(255,255,255,0.12)' : 'transparent';
  const fg = color ?? (variant === 'dark' ? '#FFFFFF' : colors.textPrimary);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: bg, borderColor: variant === 'surface' ? colors.border : 'transparent', opacity: pressed ? 0.7 : 1 },
      ]}>
      <Icon name={icon} size={size} color={fg} />
      {badge ? <View style={[styles.badge, { backgroundColor: colors.actIcon, borderColor: bg === 'transparent' ? colors.bg : bg }]} /> : null}
    </Pressable>
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

export type ButtonVariant = 'primary' | 'brand' | 'clinician' | 'secondary' | 'destructive' | 'ghost' | 'light';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  compact,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const map: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.ink, fg: colors.onInk },
    brand: { bg: colors.brand, fg: colors.onFill },
    clinician: { bg: colors.clinician, fg: colors.onFill },
    secondary: { bg: 'transparent', fg: colors.textPrimary, border: colors.border },
    destructive: { bg: 'transparent', fg: colors.act, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.brand },
    light: { bg: colors.surface, fg: colors.textPrimary },
  };
  const v = map[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1 : 0 },
        (disabled || pressed) && { opacity: disabled ? 0.45 : 0.85 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
          <Text style={[type.bodyStrong, { color: v.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

export function Card({
  children,
  style,
  tone = 'surface',
  onPress,
  padded = true,
  label,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'brand' | 'brandFill' | 'clinician' | 'muted';
  onPress?: () => void;
  padded?: boolean;
  label?: string;
}) {
  const { colors } = useTheme();
  const tones = {
    surface: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
    brand: { backgroundColor: colors.brandWash, borderWidth: 0 },
    brandFill: { backgroundColor: colors.brand, borderWidth: 0 },
    clinician: { backgroundColor: colors.clinicianWash, borderWidth: 0 },
    muted: { backgroundColor: colors.surfaceMuted, borderWidth: 0 },
  } as const;
  const base = [{ borderRadius: radius.card, padding: padded ? space.lg : 0, overflow: 'hidden' as const }, tones[tone], style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

/** White list with hairline separators between rows. */
export function List({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, style]}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg }} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

export type IconTone = 'brand' | 'clinician' | 'muted' | 'act' | 'good' | 'watch';

export function IconTile({ icon, tone = 'brand', size = 40 }: { icon: IconName; tone?: IconTone; size?: number }) {
  const { colors } = useTheme();
  const t = {
    brand: [colors.brandWash, colors.brandDeep],
    clinician: [colors.clinicianWash, colors.clinician],
    muted: [colors.surfaceMuted, colors.textSecondary],
    act: [colors.actWash, colors.actIcon],
    good: [colors.goodWash, colors.goodIcon],
    watch: [colors.watchWash, colors.watchIcon],
  }[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: radius.control, backgroundColor: t[0], alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.5} color={t[1]} />
    </View>
  );
}

export function Row({
  icon,
  iconTone,
  leading,
  title,
  subtitle,
  value,
  right,
  chevron,
  onPress,
  destructive,
  label,
  muted,
}: {
  icon?: IconName;
  iconTone?: IconTone;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: string;
  right?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  label?: string;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      {leading ?? (icon ? (iconTone ? <IconTile icon={icon} tone={iconTone} /> : <Icon name={icon} size={20} color={destructive ? colors.act : colors.textSecondary} />) : null)}
      <View style={{ flex: 1, gap: 1 }}>
        {typeof title === 'string' ? (
          <Txt variant="bodyStrong" color={destructive ? 'act' : 'primary'}>
            {title}
          </Txt>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Txt variant="small" color="secondary">
            {subtitle}
          </Txt>
        ) : (
          subtitle
        )}
      </View>
      {value ? (
        <Txt variant="small" color="secondary">
          {value}
        </Txt>
      ) : null}
      {right}
      {chevron ? <Icon name="chevron-right" size={22} color={colors.textMuted} /> : null}
    </>
  );
  const rowStyle = [styles.row, muted && { opacity: 0.55 }];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? (typeof title === 'string' ? title : undefined)}
      style={({ pressed }) => [...rowStyle, pressed && { backgroundColor: colors.surfaceMuted }]}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
      <Txt variant="heading">{title}</Txt>
      {action ? (
        <Txt variant="smallStrong" color="brand" onPress={onAction}>
          {action}
        </Txt>
      ) : null}
    </View>
  );
}

/* ───────────────────────── Chips and pills ───────────────────────── */

export function Chip({
  label,
  selected,
  onPress,
  onRemove,
  icon,
  tone = 'filter',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: IconName;
  tone?: 'filter' | 'tag' | 'clinician';
}) {
  const { colors } = useTheme();
  let bg = colors.surface;
  let fg = colors.textPrimary;
  let border = colors.border;
  if (tone === 'filter' && selected) {
    bg = colors.ink;
    fg = colors.onInk;
    border = colors.ink;
  } else if (tone === 'tag') {
    bg = colors.brandWash;
    fg = colors.brandDeep;
    border = colors.brandWash;
  } else if (tone === 'clinician') {
    bg = selected ? colors.clinician : colors.clinicianWash;
    fg = selected ? colors.onFill : colors.clinician;
    border = bg;
  }
  return (
    <Pressable
      onPress={onPress ?? onRemove}
      disabled={!onPress && !onRemove}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={onRemove ? `Remove ${label}` : label}
      style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={[type.smallStrong, { color: fg }]}>{label}</Text>
      {onRemove ? <Icon name="close" size={16} color={fg} /> : null}
    </Pressable>
  );
}

export type PillTone = 'good' | 'watch' | 'act' | 'neutral' | 'brand' | 'clinician';

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { colors } = useTheme();
  const t = {
    good: [colors.goodWash, colors.good],
    watch: [colors.watchWash, colors.watch],
    act: [colors.actWash, colors.act],
    neutral: [colors.surfaceMuted, colors.textSecondary],
    brand: [colors.brandWash, colors.brandDeep],
    clinician: [colors.clinicianWash, colors.clinician],
  }[tone];
  return (
    <View style={{ backgroundColor: t[0], borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={[type.smallStrong, { color: t[1], fontSize: 12 }]}>{label}</Text>
    </View>
  );
}

export function levelTone(level: ConcernLevel): PillTone {
  return level === 'Clear' ? 'good' : level === 'Mild' ? 'watch' : 'act';
}

/* ───────────────────────── Inputs ───────────────────────── */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  error,
  hint,
  keyboardType,
  multiline,
  autoCapitalize,
  right,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  error?: string | null;
  hint?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  right?: ReactNode;
  editable?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: error ? colors.actIcon : colors.border,
          borderRadius: radius.control,
          backgroundColor: colors.surface,
          paddingHorizontal: space.md,
          paddingTop: 6,
          paddingBottom: multiline ? space.sm : 4,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted">
            {label}
          </Txt>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secure}
            keyboardType={keyboardType}
            multiline={multiline}
            editable={editable}
            autoCapitalize={autoCapitalize}
            accessibilityLabel={label}
            style={[type.body, { color: colors.textPrimary, paddingVertical: 2, minHeight: multiline ? 66 : undefined, textAlignVertical: multiline ? 'top' : 'center' }]}
          />
        </View>
        {right}
      </View>
      {error ? (
        <Txt variant="small" color="act">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="small" color="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  tone = 'brand',
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  tone?: 'brand' | 'clinician';
}) {
  const { colors } = useTheme();
  const accent = tone === 'clinician' ? colors.clinician : colors.brand;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? (tone === 'clinician' ? colors.clinicianWash : colors.brandWash) : colors.surface,
          borderColor: selected ? accent : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {icon ? <IconTile icon={icon} tone={tone === 'clinician' ? 'clinician' : selected ? 'brand' : 'muted'} size={36} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {subtitle ? (
          <Txt variant="small" color="secondary">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? accent : colors.border }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: accent }]} /> : null}
      </View>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.control, padding: 3 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              minHeight: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.control - 3,
              backgroundColor: active ? colors.surface : 'transparent',
            }}>
            <Text style={[type.smallStrong, { color: active ? colors.textPrimary : colors.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  icon,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <Row
      icon={icon}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel={title}
          trackColor={{ true: colors.brand, false: colors.surfaceMuted }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.surfaceMuted}
        />
      }
    />
  );
}

/** Thin progress bar of `total` segments used at the top of onboarding steps. */
export function StepBar({ total, current, tone = 'brand' }: { total: number; current: number; tone?: 'brand' | 'clinician' }) {
  const { colors } = useTheme();
  const on = tone === 'clinician' ? colors.clinician : colors.brand;
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < current ? on : colors.border }} />
      ))}
    </View>
  );
}

export function ProgressBar({ value, color, track }: { value: number; color: string; track?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: track ?? colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

/* ───────────────────────── People ───────────────────────── */

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function Avatar({ name, size = 44, tone, clinician }: { name: string; size?: number; tone?: number; clinician?: boolean }) {
  const { colors } = useTheme();
  const idx = tone ?? (name.length % 6);
  const bg = clinician ? colors.clinicianWash : fitzpatrick[idx];
  const fg = clinician ? colors.clinician : idx >= 3 ? '#FFFFFF' : '#0E2A33';
  return (
    <View
      accessibilityLabel={name}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: size * 0.36, color: fg }}>{initials(name)}</Text>
    </View>
  );
}

/* ───────────────────────── Messages ───────────────────────── */

export function Banner({
  icon = 'stethoscope',
  text,
  action,
  onAction,
  tone = 'brand',
}: {
  icon?: IconName;
  text: string;
  action?: string;
  onAction?: () => void;
  tone?: 'brand' | 'clinician' | 'watch';
}) {
  const { colors } = useTheme();
  const bg = tone === 'clinician' ? colors.clinicianWash : tone === 'watch' ? colors.watchWash : colors.brandWash;
  const fg = tone === 'clinician' ? colors.clinician : tone === 'watch' ? colors.watch : colors.brandDeep;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.card, padding: space.lg, flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
      <Icon name={icon} size={22} color={fg} />
      <Text style={[type.small, { color: fg, flex: 1 }]}>{text}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={{ minHeight: hitTarget, justifyContent: 'center' }}>
          <Text style={[type.smallStrong, { color: fg, textDecorationLine: 'underline' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.sm }}>
      <Icon name={icon} size={36} color={colors.textMuted} />
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      <Txt variant="small" color="secondary" align="center">
        {body}
      </Txt>
      {action ? <Button label={action} onPress={onAction} variant="secondary" compact style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

export function Disclaimer() {
  return (
    <Txt variant="caption" color="muted" align="center">
      DermAI gives guidance, not a diagnosis.
    </Txt>
  );
}

export function Stat({ value, label, style }: { value: string; label: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: 2 }, style]}>
      <Txt variant="number">{value}</Txt>
      <Txt variant="small" color="secondary">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingVertical: space.sm,
    minHeight: 56,
  },
  iconButton: {
    width: hitTarget,
    height: hitTarget,
    borderRadius: hitTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 56,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});

export { makeStyles };

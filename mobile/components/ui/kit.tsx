import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Children, Fragment, isValidElement, useState, type ReactNode } from 'react';
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
import { dockClearance, fonts, hitTarget, radius, space, type, type TypeVariant } from '@/theme/tokens';

/* ───────────────────────── Text ───────────────────────── */

type TextColor =
  | 'primary' | 'secondary' | 'muted' | 'brand' | 'brandDeep' | 'clinician'
  | 'good' | 'watch' | 'act' | 'onFill' | 'onInk' | 'peach' | 'butter';

function textColor(c: ThemeColors, color: TextColor): string {
  switch (color) {
    case 'primary': return c.textPrimary;
    case 'secondary': return c.textSecondary;
    case 'muted': return c.textMuted;
    case 'brand': return c.brand;
    case 'brandDeep': return c.brandDeep;
    case 'clinician': return c.clinicianDeep;
    case 'good': return c.good;
    case 'watch': return c.watch;
    case 'act': return c.act;
    case 'onFill': return c.onFill;
    case 'onInk': return c.onInk;
    case 'peach': return c.peachDeep;
    case 'butter': return c.butterDeep;
  }
}

/** Lumen's soft drop shadow (light mode only; dark surfaces separate by colour). */
export function shadow(c: ThemeColors, strong = false): ViewStyle {
  if (c.shadow === 'rgba(0, 0, 0, 0)') return {};
  return { boxShadow: strong ? `0 14px 30px -12px ${c.shadow.replace('0.14', '0.4')}` : `0 1px 2px rgba(20,35,61,0.05), 0 6px 16px -8px ${c.shadow}` } as ViewStyle;
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
  footerStyle,
  dock,
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
  /** e.g. a pinned summary sheet look for the footer. */
  footerStyle?: StyleProp<ViewStyle>;
  /** Tab screens: leave room for the floating dock. */
  dock?: boolean;
}) {
  const { colors } = useTheme();
  // Hook insets instead of SafeAreaView: SafeAreaView reads zero inside iOS full-screen modals.
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = padded ? { paddingHorizontal: space.screen } : {};
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[pad, { paddingBottom: dock ? dockClearance + insets.bottom : space.xl, gap: space.md + 2 }, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
  );
  const used = footer ? [...edges, 'bottom'] : edges;
  const inner = (
    <>
      {header}
      <View style={{ flex: 1 }}>{body}</View>
      {footer ? (
        <View
          style={[
            { paddingHorizontal: space.screen, paddingTop: space.sm + 2, paddingBottom: (used.includes('bottom') ? insets.bottom : 0) + space.md, gap: space.sm },
            footerStyle,
          ]}>
          {footer}
        </View>
      ) : null}
    </>
  );
  return (
    <View style={[{ flex: 1, backgroundColor: bg ?? colors.bg, paddingTop: used.includes('top') ? insets.top : 0, paddingBottom: !footer && used.includes('bottom') ? insets.bottom : 0 }]}>
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
          <Txt variant="heading" color={dark ? 'onFill' : 'primary'} numberOfLines={1} style={{ fontSize: 16 }}>
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
  const bg = variant === 'surface' ? colors.surface : variant === 'dark' ? 'rgba(255,255,255,0.14)' : 'transparent';
  const fg = color ?? (variant === 'dark' ? '#FFFFFF' : colors.textPrimary);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }, variant === 'surface' && shadow(colors)]}>
      <Icon name={icon} size={size} color={fg} />
      {badge ? <View style={[styles.badge, { backgroundColor: colors.actIcon, borderColor: bg === 'transparent' ? colors.bg : bg }]} /> : null}
    </Pressable>
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

export type ButtonVariant = 'primary' | 'brand' | 'clinician' | 'secondary' | 'destructive' | 'ghost' | 'light' | 'ink' | 'soft';

/** Pill buttons. `primary` and `brand` are the blue-to-teal gradient (teal-green on doctor screens), `ink` is navy. */
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
  const map: Record<ButtonVariant, { bg: string; fg: string; border?: string; glow?: boolean }> = {
    primary: { bg: colors.brand, fg: colors.onFill, glow: true },
    brand: { bg: colors.brand, fg: colors.onFill, glow: true },
    clinician: { bg: colors.clinician, fg: colors.onFill },
    ink: { bg: colors.ink, fg: colors.onInk },
    soft: { bg: colors.brandWash, fg: colors.brandDeep },
    secondary: { bg: 'transparent', fg: colors.textPrimary, border: colors.border },
    destructive: { bg: 'transparent', fg: colors.act, border: colors.actWash },
    ghost: { bg: 'transparent', fg: colors.brand },
    light: { bg: colors.surface, fg: colors.textPrimary },
  };
  const v = map[variant];
  const gradient = (variant === 'primary' || variant === 'brand') && colors.brandAlt !== colors.brand;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1.5 : 0 },
        variant === 'light' && shadow(colors),
        v.glow && !disabled && colors.shadow !== 'rgba(0, 0, 0, 0)' ? ({ boxShadow: `0 10px 22px -14px ${v.bg}` } as ViewStyle) : null,
        (disabled || pressed) && { opacity: disabled ? 0.42 : 0.86 },
        style,
      ]}>
      {gradient ? (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.brand, colors.brandAlt]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
          <Text style={[type.bodyStrong, { color: v.fg, fontSize: compact ? 13 : 15 }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

export type CardTone = 'surface' | 'brand' | 'brandFill' | 'clinician' | 'clinicianFill' | 'muted' | 'peach' | 'butter' | 'night';

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
  tone?: CardTone;
  onPress?: () => void;
  padded?: boolean;
  label?: string;
}) {
  const { colors } = useTheme();
  const tones: Record<CardTone, ViewStyle> = {
    surface: { backgroundColor: colors.surface, ...shadow(colors) },
    brand: { backgroundColor: colors.brandWash },
    brandFill: { backgroundColor: colors.brand, ...(colors.shadow !== 'rgba(0, 0, 0, 0)' ? ({ boxShadow: `0 12px 24px -14px ${colors.brand}` } as ViewStyle) : {}) },
    clinician: { backgroundColor: colors.clinicianWash },
    clinicianFill: { backgroundColor: colors.clinician },
    muted: { backgroundColor: colors.surfaceMuted },
    peach: { backgroundColor: colors.peachWash },
    butter: { backgroundColor: colors.butterWash },
    night: { backgroundColor: '#0E1A2E' },
  };
  const base = [{ borderRadius: radius.card, padding: padded ? space.lg : 0, overflow: 'hidden' as const }, tones[tone], style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [...base, pressed && { opacity: 0.88 }]}>
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
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden' }, shadow(colors), style]}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg }} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

export type IconTone = 'brand' | 'clinician' | 'muted' | 'act' | 'good' | 'watch' | 'peach' | 'butter';

export function IconTile({ icon, tone = 'brand', size = 40 }: { icon: IconName; tone?: IconTone; size?: number }) {
  const { colors } = useTheme();
  const t = {
    brand: [colors.brandWash, colors.brandDeep],
    clinician: [colors.clinicianWash, colors.clinicianDeep],
    muted: [colors.surfaceMuted, colors.textSecondary],
    act: [colors.actWash, colors.actIcon],
    good: [colors.goodWash, colors.goodIcon],
    watch: [colors.watchWash, colors.watchIcon],
    peach: [colors.peachWash, colors.peachDeep],
    butter: [colors.butterWash, colors.butterDeep],
  }[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: t[0], alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.52} color={t[1]} />
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
  action,
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
  /** A tappable control at the end (remove, toggle). Kept outside the row's own button so buttons never nest. */
  action?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  label?: string;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      {leading ?? (icon ? <IconTile icon={icon} tone={destructive ? 'act' : (iconTone ?? 'brand')} size={36} /> : null)}
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
      {chevron && !action ? <Icon name="chevron-right" size={22} color={colors.textMuted} /> : null}
    </>
  );
  const rowStyle = [styles.row, muted && { opacity: 0.55 }];
  if (!onPress) return <View style={rowStyle}>{content}{action}</View>;
  if (action) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', opacity: muted ? 0.55 : 1 }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label ?? (typeof title === 'string' ? title : undefined)}
          style={({ pressed }) => [styles.row, { flex: 1, paddingRight: space.sm }, pressed && { backgroundColor: colors.surfaceMuted }]}>
          {content}
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.md + 2 }}>
          {action}
          {chevron ? <Icon name="chevron-right" size={22} color={colors.textMuted} /> : null}
        </View>
      </View>
    );
  }
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
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs }}>
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
  tone?: 'filter' | 'tag' | 'clinician' | 'butter';
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
    bg = selected ? colors.brand : colors.brandWash;
    fg = selected ? colors.onFill : colors.brandDeep;
    border = bg;
  } else if (tone === 'clinician') {
    bg = selected ? colors.clinician : colors.clinicianWash;
    fg = selected ? colors.onFill : colors.clinicianDeep;
    border = bg;
  } else if (tone === 'butter') {
    bg = colors.butterWash;
    fg = colors.butterDeep;
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
      {icon ? <Icon name={icon} size={15} color={fg} /> : tone === 'filter' && selected ? <Icon name="check" size={15} color={fg} /> : null}
      <Text style={[type.smallStrong, { color: fg, fontSize: 12.5 }]}>{label}</Text>
      {onRemove ? <Icon name="close" size={15} color={fg} /> : null}
    </Pressable>
  );
}

export type PillTone = 'good' | 'watch' | 'act' | 'neutral' | 'brand' | 'clinician' | 'butter';

export function StatusPill({ label, tone = 'neutral', icon }: { label: string; tone?: PillTone; icon?: IconName }) {
  const { colors } = useTheme();
  const t = {
    good: [colors.goodWash, colors.good],
    watch: [colors.watchWash, colors.watch],
    act: [colors.actWash, colors.act],
    neutral: [colors.surfaceMuted, colors.textSecondary],
    brand: [colors.brandWash, colors.brandDeep],
    clinician: [colors.clinicianWash, colors.clinicianDeep],
    butter: [colors.butterWash, colors.butterDeep],
  }[tone];
  return (
    <View style={{ backgroundColor: t[0], borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {icon ? <Icon name={icon} size={13} color={t[1]} /> : null}
      <Text style={[type.smallStrong, { color: t[1], fontSize: 11.5, lineHeight: 15 }]}>{label}</Text>
    </View>
  );
}

/** Words carry the level; colour backs it up. */
export function levelTone(level: ConcernLevel): PillTone {
  return level === 'Clear' ? 'good' : level === 'Mild' ? 'neutral' : level === 'Moderate' ? 'watch' : 'act';
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
  onSubmitEditing,
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
  onSubmitEditing?: () => void;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs }}>
      <View
        style={[
          {
            borderWidth: 1.5,
            borderColor: error ? colors.actIcon : focused ? colors.brand : colors.border,
            borderRadius: radius.control,
            backgroundColor: colors.surface,
            paddingHorizontal: space.md + 2,
            paddingTop: 7,
            paddingBottom: multiline ? space.sm : 5,
            flexDirection: 'row',
            alignItems: 'center',
          },
          focused && !error ? ({ boxShadow: `0 0 0 4px ${colors.brandWash}` } as ViewStyle) : null,
        ]}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted" style={{ fontSize: 11.5 }}>
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
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmitEditing}
            style={[type.body, { color: colors.textPrimary, paddingVertical: 2, minHeight: multiline ? 66 : undefined, textAlignVertical: multiline ? 'top' : 'center' }]}
          />
        </View>
        {right}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Icon name="error" size={14} color={colors.act} />
          <Txt variant="small" color="act" style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
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
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  tone?: 'brand' | 'clinician';
  right?: ReactNode;
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
          backgroundColor: colors.surface,
          borderColor: selected ? accent : colors.border,
          borderWidth: selected ? 2 : 1.5,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      {icon ? <IconTile icon={icon} tone={tone === 'clinician' ? 'clinician' : selected ? 'brand' : 'muted'} size={36} /> : null}
      <View style={[styles.radio, { borderColor: selected ? accent : colors.textMuted, borderWidth: selected ? 6 : 1.5 }]} />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {subtitle ? (
          <Txt variant="small" color="secondary">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.full, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              {
                flex: 1,
                minHeight: 36,
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.full,
                backgroundColor: active ? colors.surface : 'transparent',
              },
              active && shadow(colors),
            ]}>
            {o.icon ? <Icon name={o.icon} size={15} color={active ? colors.textPrimary : colors.textSecondary} /> : null}
            <Text style={[type.smallStrong, { color: active ? (colors.brand === colors.clinician ? colors.clinicianDeep : colors.textPrimary) : colors.textSecondary }]}>{o.label}</Text>
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
  iconTone,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
  iconTone?: IconTone;
}) {
  const { colors } = useTheme();
  return (
    <Row
      icon={icon}
      iconTone={iconTone}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel={title}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
        />
      }
    />
  );
}

/** A round tick for routine steps and checklists. */
export function Tick({ on, size = 28, onPress, label }: { on: boolean; size?: number; onPress?: () => void; label?: string }) {
  const { colors } = useTheme();
  const dot = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: on ? colors.brand : 'transparent',
        borderWidth: on ? 0 : 1.8,
        borderColor: colors.brandSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {on ? <Icon name="check" size={size * 0.62} color={colors.onFill} /> : null}
    </View>
  );
  if (!onPress) return dot;
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label} hitSlop={8} style={{ minWidth: hitTarget, minHeight: hitTarget, alignItems: 'center', justifyContent: 'center' }}>
      {dot}
    </Pressable>
  );
}

/** Thin progress bar of `total` segments used at the top of onboarding steps. */
export function StepBar({ total, current, tone = 'brand' }: { total: number; current: number; tone?: 'brand' | 'clinician' }) {
  const { colors } = useTheme();
  const on = tone === 'clinician' ? colors.clinician : colors.brand;
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i < current ? on : colors.border }} />
      ))}
    </View>
  );
}

export function ProgressBar({ value, color, track }: { value: number; color: string; track?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 6, borderRadius: 9, backgroundColor: track ?? colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: 9 }} />
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

export function Avatar({ name, size = 44, tone, clinician, uri }: { name: string; size?: number; tone?: number; clinician?: boolean; uri?: string | null }) {
  const { colors } = useTheme();
  const idx = tone ?? (name.length % 6);
  const bg = clinician ? colors.clinicianWash : fitzpatrick[idx];
  const fg = clinician ? colors.clinicianDeep : idx >= 2 ? '#FFFFFF' : '#6B4632';
  if (uri) {
    return <Image source={{ uri }} accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }} contentFit="cover" />;
  }
  return (
    <View
      accessibilityLabel={name}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display700, fontSize: size * 0.34, letterSpacing: -0.3, color: fg }}>{initials(name)}</Text>
    </View>
  );
}

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
  tone?: 'brand' | 'clinician' | 'watch' | 'act' | 'peach' | 'butter';
}) {
  const { colors } = useTheme();
  const [bg, fg] = {
    brand: [colors.brandWash, colors.brandDeep],
    clinician: [colors.clinicianWash, colors.clinicianDeep],
    watch: [colors.watchWash, colors.watch],
    act: [colors.actWash, colors.act],
    peach: [colors.peachWash, colors.peachDeep],
    butter: [colors.butterWash, colors.butterDeep],
  }[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.card - 2, padding: space.md + 2, flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
      <Icon name={icon} size={20} color={fg} />
      <Text style={[type.small, { color: fg, flex: 1 }]}>{text}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={{ minHeight: 24, justifyContent: 'center' }}>
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
      <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={30} color={colors.brandDeep} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      <Txt variant="small" color="secondary" align="center">
        {body}
      </Txt>
      {action ? <Button label={action} onPress={onAction} variant="soft" compact style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

/** Centred spinner for a screen that is still fetching what it shows. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl }} accessibilityLabel={label} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.brandDeep} />
    </View>
  );
}

/** A form or request error, announced to screen readers. Renders nothing when there is no error. */
export function ErrorBanner({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Banner icon="error-outline" tone="act" text={error} />
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

/** KPI tile: a big Bricolage number over a short label. */
export function Stat({ value, label, style, tone, valueColor }: { value: string; label: string; style?: StyleProp<ViewStyle>; tone?: 'butter' | 'act'; valueColor?: string }) {
  const { colors } = useTheme();
  const bg = tone === 'butter' ? colors.butterWash : tone === 'act' ? colors.actWash : colors.surface;
  return (
    <View style={[{ flex: 1, backgroundColor: bg, borderRadius: radius.control + 2, paddingHorizontal: space.md, paddingVertical: space.sm + 2, gap: 2 }, !tone && shadow(colors), style]}>
      <Text style={[type.number, { color: valueColor ?? (tone === 'act' ? colors.act : colors.textPrimary) }]}>{value}</Text>
      <Txt variant="caption" color="secondary">
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.full,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: space.md + 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md - 1,
    minHeight: 56,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: space.md + 1,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md + 1,
    borderRadius: radius.control + 2,
  },
  radio: { width: 20, height: 20, borderRadius: 10 },
});

export { makeStyles };

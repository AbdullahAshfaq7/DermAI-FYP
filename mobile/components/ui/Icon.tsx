import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/**
 * design.md asks for Material Symbols Rounded; MaterialIcons is the documented fallback.
 * Two glyphs only exist in the community set, so they are routed there.
 */
const COMMUNITY = { stethoscope: 'stethoscope', 'calendar-plus': 'calendar-plus' } as const;

export type IconName = ComponentProps<typeof MaterialIcons>['name'] | keyof typeof COMMUNITY;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  if (name in COMMUNITY) {
    return <MaterialCommunityIcons name={COMMUNITY[name as keyof typeof COMMUNITY]} size={size} color={color} />;
  }
  return <MaterialIcons name={name as ComponentProps<typeof MaterialIcons>['name']} size={size} color={color} />;
}

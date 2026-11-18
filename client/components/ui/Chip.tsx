import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { shadows } from '../../theme/shadows';
import type { IconName } from './IconButton';

interface Props {
  label: string;
  active: boolean;
  /** Omit to render a purely informational (non-tappable) chip. */
  onPress?: () => void;
  icon?: IconName;
  /** Floating variant: opaque + shadowed so it reads over a map. */
  floating?: boolean;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, icon, floating, style }: Props) {
  const { colors } = useThemeContext();
  const fg = active ? '#fff' : colors.text1;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected: active } : undefined}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.purple : floating ? colors.glass : colors.surface1,
          borderColor: active ? colors.purple : colors.borderMed,
          opacity: pressed ? 0.8 : 1,
        },
        floating && { ...shadows.sm, shadowColor: colors.shadow, borderWidth: active ? 1 : 0 },
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={15} color={active ? '#fff' : colors.text2} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  label: string;
  active: boolean;
  /** Omit to render a purely informational (non-tappable) chip. */
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.purpleDim : colors.surface2,
          borderColor: active ? colors.purple : colors.borderMed,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.purpleText : colors.text2 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});

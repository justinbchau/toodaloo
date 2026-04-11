import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.purpleDim : colors.surface2,
          borderColor: active ? colors.purple : colors.borderMed,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.purpleText : colors.text2 }]}>
        {label}
      </Text>
    </TouchableOpacity>
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

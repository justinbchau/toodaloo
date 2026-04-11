import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

interface Props {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function AmenityToggle({ label, active, onToggle }: Props) {
  const { colors } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      style={[
        styles.item,
        {
          backgroundColor: active ? colors.purpleDim : colors.surface2,
          borderColor: active ? colors.purple : colors.borderMed,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: active ? colors.purple : colors.text3 }]} />
      <Text style={[styles.label, { color: active ? colors.purpleText : colors.text2 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
  },
});

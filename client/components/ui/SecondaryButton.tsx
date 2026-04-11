import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function SecondaryButton({ title, onPress, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: colors.surface2, borderColor: colors.borderMed }, style]}
    >
      <Text style={[styles.label, { color: colors.text2 }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

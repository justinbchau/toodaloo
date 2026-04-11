import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, style, disabled }: Props) {
  const { colors } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: colors.purple, shadowColor: colors.purpleGlow, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text style={[styles.label, { color: '#fff' }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
});

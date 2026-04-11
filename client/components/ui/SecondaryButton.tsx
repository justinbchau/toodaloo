import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function SecondaryButton({ title, onPress, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [styles.btn, { backgroundColor: colors.surface2, borderColor: colors.borderMed, opacity: pressed ? 0.8 : 1 }, style]}
    >
      <Text style={[styles.label, { color: colors.text2 }]}>{title}</Text>
    </Pressable>
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

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  label: string;
  style?: TextStyle;
}

export function SectionLabel({ label, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <Text style={[styles.text, { color: colors.text3 }, style]}>
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
});

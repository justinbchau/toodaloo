import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  label: string;
  style?: TextStyle;
}

/** Section heading inside a scrolling page (e.g. "Amenities", "Reviews"). */
export function SectionLabel({ label, style }: Props) {
  const { colors } = useThemeContext();
  return (
    <Text accessibilityRole="header" style={[styles.text, { color: colors.text1 }, style]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
});

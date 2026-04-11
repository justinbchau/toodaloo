import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

interface Props {
  stat: string;
  label: string;
}

export function StatBlock({ stat, label }: Props) {
  const { colors } = useThemeContext();
  return (
    <View style={styles.container}>
      <Text style={[styles.stat, { color: colors.text1 }]}>{stat}</Text>
      <Text style={[styles.label, { color: colors.text3 }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  stat: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  label: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 2,
  },
});

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import type { IconName } from './IconButton';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: IconName;
  size?: 'lg' | 'md';
  disabled?: boolean;
  testID?: string;
}

export function SecondaryButton({ title, onPress, style, icon, size = 'lg', disabled, testID }: Props) {
  const { colors } = useThemeContext();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }: { pressed: boolean }) => [
        styles.btn,
        size === 'md' && styles.md,
        { backgroundColor: colors.surface1, borderColor: colors.borderMed, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <MaterialCommunityIcons name={icon} size={size === 'md' ? 18 : 20} color={colors.text1} /> : null}
        <Text style={[styles.label, size === 'md' && styles.labelMd, { color: colors.text1 }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    minHeight: 54,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  md: { minHeight: 46, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  labelMd: { fontSize: 15 },
});

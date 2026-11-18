import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import type { IconName } from './IconButton';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  /** Shows a spinner in place of the label and blocks presses. */
  loading?: boolean;
  /** Leading icon. */
  icon?: IconName;
  size?: 'lg' | 'md';
  testID?: string;
  accessibilityLabel?: string;
}

export function PrimaryButton({ title, onPress, style, disabled, loading, icon, size = 'lg', testID, accessibilityLabel }: Props) {
  const { colors } = useThemeContext();
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.btn,
        size === 'md' && styles.md,
        {
          backgroundColor: colors.purple,
          shadowColor: colors.purple,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !inactive ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          {icon ? <MaterialCommunityIcons name={icon} size={size === 'md' ? 18 : 20} color="#fff" /> : null}
          <Text style={[styles.label, size === 'md' && styles.labelMd]}>{title}</Text>
        </View>
      )}
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  md: { minHeight: 46, borderRadius: 14, shadowOpacity: 0.22, shadowRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.1,
  },
  labelMd: { fontSize: 15 },
});

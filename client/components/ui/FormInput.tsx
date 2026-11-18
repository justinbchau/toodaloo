import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import type { IconName } from './IconButton';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  /** Leading icon inside the field. */
  icon?: IconName;
  /** Helper text shown under the field when there's no error. */
  hint?: string;
}

export function FormInput({ label, error, icon, hint, ...inputProps }: Props) {
  const { colors } = useThemeContext();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.red : focused ? colors.purple : colors.borderMed;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text2 }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface1,
            borderColor,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {icon ? <MaterialCommunityIcons name={icon} size={19} color={focused ? colors.purpleText : colors.text3} /> : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.text3}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          style={[styles.input, { color: colors.text1 }]}
        />
      </View>
      {error ? (
        <View style={styles.msgRow}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.red} />
          <Text style={[styles.msg, { color: colors.red }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.msg, { color: colors.text3 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  msg: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});

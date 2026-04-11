import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function FormInput({ label, error, ...inputProps }: Props) {
  const { colors } = useThemeContext();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text3 }]}>{label.toUpperCase()}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.text3}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
        style={[
          styles.input,
          {
            backgroundColor: focused ? colors.purpleDim : colors.surface2,
            borderColor: focused ? colors.purple : colors.borderMed,
            color: colors.text1,
          },
        ]}
      />
      {error ? <Text style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  error: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});

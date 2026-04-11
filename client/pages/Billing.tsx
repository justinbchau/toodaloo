import React from 'react';
import { View, Text } from 'react-native';
import { Page } from '../templates/Page';
import { useThemeContext } from '../context/ThemeContext';
import { SectionLabel } from '../components/ui/SectionLabel';

export function Billing() {
  const { colors } = useThemeContext();

  return (
    <Page>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: colors.text1, marginBottom: 24 }}>
          Billing
        </Text>

        <SectionLabel label="Current plan" />
        <View style={{
          marginTop: 10,
          backgroundColor: colors.surface1,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{ fontSize: 36 }}>🤑</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: colors.text1 }}>
            Free Plan
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.text2, textAlign: 'center' }}>
            You're on the free plan. Upgrade for premium features.
          </Text>
        </View>
      </View>
    </Page>
  );
}

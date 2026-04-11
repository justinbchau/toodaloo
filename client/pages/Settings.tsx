import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Page } from '../templates/Page';
import { useThemeContext } from '../context/ThemeContext';
import { SectionLabel } from '../components/ui/SectionLabel';

export function Settings() {
  const { colors, isDark, toggleTheme } = useThemeContext();

  return (
    <Page>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: colors.text1, marginBottom: 24 }}>
          Settings
        </Text>

        <SectionLabel label="Appearance" />
        <View style={{
          marginTop: 10,
          backgroundColor: colors.surface1,
          borderRadius: 16,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 14,
          }}>
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, color: colors.text1 }}>
                Dark mode
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.text3, marginTop: 2 }}>
                {isDark ? 'Currently dark' : 'Currently light'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? colors.purple : '#ccc'}
              trackColor={{ false: colors.surface3, true: colors.purpleDim }}
            />
          </View>
        </View>
      </View>
    </Page>
  );
}

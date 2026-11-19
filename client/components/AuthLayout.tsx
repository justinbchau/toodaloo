import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { IconButton, IconName } from './ui/IconButton';

interface Props {
  icon: IconName;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  /** Pinned under the content, above the keyboard (primary action + links). */
  footer: React.ReactNode;
}

/**
 * Shared frame for the email-OTP auth screens: back button, icon badge, big
 * title, then the form, with the primary action pinned above the keyboard.
 */
export function AuthLayout({ icon, title, subtitle, children, footer }: Props) {
  const { colors } = useThemeContext();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <IconButton icon="chevron-left" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: colors.surface1,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <MaterialCommunityIcons name={icon} size={28} color={colors.text1} />
          </View>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 30, letterSpacing: -1, color: colors.text1 }}
          >
            {title}
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, lineHeight: 22, color: colors.text2, marginTop: 8 }}>
            {subtitle}
          </Text>
          <View style={{ marginTop: 28 }}>{children}</View>
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 }}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Inline banner for auth errors / notices. */
export function AuthNotice({ tone, children, testID }: { tone: 'error' | 'success'; children: React.ReactNode; testID?: string }) {
  const { colors } = useThemeContext();
  const fg = tone === 'error' ? colors.red : colors.green;
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: tone === 'error' ? colors.redDim : colors.greenDim,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 16,
      }}
    >
      <MaterialCommunityIcons name={tone === 'error' ? 'alert-circle-outline' : 'check-circle-outline'} size={18} color={fg} />
      <Text style={{ flex: 1, color: fg, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

/** "Prompt · Action" switch link under the primary button. */
export function AuthSwitch({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  const { colors } = useThemeContext();
  return (
    <Text style={{ textAlign: 'center', marginTop: 16, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text2 }}>
      {prompt}{' '}
      <Text accessibilityRole="link" onPress={onPress} style={{ color: colors.accentText, fontFamily: 'PlusJakartaSans_700Bold' }}>
        {action}
      </Text>
    </Text>
  );
}

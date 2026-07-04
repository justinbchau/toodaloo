import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { Page } from '../templates/Page';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { SectionLabel } from '../components/ui/SectionLabel';

export function Settings() {
  const { colors, isDark, toggleTheme } = useThemeContext();
  const { profile, updateUsername } = useUser();

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(profile?.username ?? '');
  }, [profile?.username]);

  const dirty = username.trim() !== (profile?.username ?? '');
  const canSave = dirty && username.trim().length >= 3 && status !== 'saving';

  const handleSave = async () => {
    Keyboard.dismiss();
    setError(null);
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    setStatus('saving');
    const { error: updateError } = await updateUsername(username);
    if (updateError) {
      setError(updateError);
      setStatus('idle');
      return;
    }
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <Page>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: colors.text1, marginBottom: 24 }}>
          Settings
        </Text>

        <SectionLabel label="Profile" />
        <View style={{
          marginTop: 10,
          marginBottom: 24,
          backgroundColor: colors.surface1,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, color: colors.text1 }}>
            Username
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.text3, marginTop: 2, marginBottom: 10 }}>
            Shown on your reviews.
          </Text>
          <TextInput
            testID="username-input"
            value={username}
            onChangeText={(t) => { setUsername(t); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Choose a username"
            placeholderTextColor={colors.text3}
            style={{
              backgroundColor: colors.surface2,
              borderColor: colors.borderMed,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.text1,
              fontFamily: 'PlusJakartaSans_400Regular',
            }}
          />
          {error && (
            <Text style={{ color: colors.red, fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 8 }}>
              {error}
            </Text>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }: { pressed: boolean }) => ({
              marginTop: 12,
              backgroundColor: canSave ? colors.purple : colors.surface3,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {status === 'saving' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: canSave ? '#fff' : colors.text3, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                {status === 'saved' ? 'Saved ✓' : 'Save username'}
              </Text>
            )}
          </Pressable>
        </View>

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

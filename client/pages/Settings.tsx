import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TextInput, Pressable, ActivityIndicator, Keyboard, Alert, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { ListGroup } from '../components/ui/ListGroup';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { MenuItem } from '../components/ui/MenuItem';
import { openLegal } from '../lib/legalUrl';

export function Settings() {
  const { colors, isDark, toggleTheme } = useThemeContext();
  const { user, profile, updateUsername, deleteAccount } = useUser();

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, reviews, and saved places. Bathrooms you added will stay listed but no longer show you as the submitter. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error: deleteError } = await deleteAccount();
            setIsDeleting(false);
            if (deleteError) {
              Alert.alert('Error', deleteError);
            }
            // On success, auth state clears and AppNavigator routes to the landing screen.
          },
        },
      ],
    );
  };

  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
      >
        {/* ── Profile ── */}
        <ListGroup
          title="Profile"
          footer="Your username is shown on your reviews. Email is used to sign in — contact support to change it."
        >
          <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderMed }]}>
            <RowIcon name="email-outline" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text1 }]}>Email</Text>
              <Text testID="email-display" numberOfLines={1} style={[styles.rowSub, { color: colors.text2 }]}>
                {user?.email ?? '—'}
              </Text>
            </View>
            <MaterialCommunityIcons name="lock-outline" size={16} color={colors.text3} />
          </View>

          <View style={[styles.row, { alignItems: 'flex-start' }]}>
            <RowIcon name="at" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text1 }]}>Username</Text>
              <View style={[styles.usernameField, { backgroundColor: colors.surface2, borderColor: error ? colors.red : colors.borderMed }]}>
                <TextInput
                  testID="username-input"
                  value={username}
                  onChangeText={(t) => { setUsername(t); setError(null); }}
                  onSubmitEditing={() => canSave && handleSave()}
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.text3}
                  style={{ flex: 1, fontSize: 15, color: colors.text1, fontFamily: 'PlusJakartaSans_500Medium', paddingVertical: 10 }}
                />
                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  accessibilityRole="button"
                  accessibilityLabel="Save username"
                  style={({ pressed }: { pressed: boolean }) => ({
                    backgroundColor: canSave ? colors.purple : status === 'saved' ? colors.greenDim : 'transparent',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 32,
                    minWidth: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {status === 'saving' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{
                      color: canSave ? '#fff' : status === 'saved' ? colors.green : colors.text3,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      fontSize: 13,
                    }}>
                      {status === 'saved' ? 'Saved ✓' : 'Save'}
                    </Text>
                  )}
                </Pressable>
              </View>
              {error && (
                <Text style={{ color: colors.red, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 6 }}>
                  {error}
                </Text>
              )}
            </View>
          </View>
        </ListGroup>

        {/* ── Appearance ── */}
        <ListGroup title="Appearance">
          <MenuItem
            icon="theme-light-dark"
            label="Dark mode"
            sublabel={isDark ? 'On' : 'Off'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                thumbColor="#fff"
                trackColor={{ false: colors.surface3, true: colors.purple }}
                ios_backgroundColor={colors.surface3}
                accessibilityLabel="Toggle dark mode"
              />
            }
          />
        </ListGroup>

        {/* ── About ── */}
        <ListGroup title="About">
          <MenuItem icon="file-document-outline" label="Terms & Privacy" sublabel="Opens in browser" onPress={openLegal} />
          <MenuItem icon="information-outline" label="Version" right={<Text style={[styles.rowSub, { color: colors.text2, marginTop: 0 }]}>{appVersion}</Text>} />
        </ListGroup>

        {/* ── Danger zone ── */}
        <ListGroup
          title="Danger zone"
          footer="Permanently removes your profile, reviews and saved places. This can't be undone."
        >
          <MenuItem
            icon="trash-can-outline"
            label="Delete my account"
            destructive
            onPress={isDeleting ? undefined : handleDeleteAccount}
            right={isDeleting ? <ActivityIndicator color={colors.red} /> : undefined}
          />
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

function RowIcon({ name }: { name: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors } = useThemeContext();
  return (
    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.purpleDim, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={name} size={18} color={colors.purpleText} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
  rowSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
  usernameField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
});

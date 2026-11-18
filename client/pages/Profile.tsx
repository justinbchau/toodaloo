import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileStackParamList } from '../RootStackParams';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { SkeletonProfileHero } from '../components/SkeletonProfileHero';
import { MenuItem } from '../components/ui/MenuItem';
import { ListGroup } from '../components/ui/ListGroup';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { IconButton } from '../components/ui/IconButton';
import { initial } from '../lib/format';
import { openLegal } from '../lib/legalUrl';

type profileScreenProp = NativeStackNavigationProp<ProfileStackParamList>;

export function Profile() {
  const navigation = useNavigation<profileScreenProp>();
  const { colors } = useThemeContext();
  const { user, profile, signOut, refreshProfile } = useUser();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState({ saved: 0, reviews: 0, added: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!isFocused || !user) return;
    refreshProfile();
  }, [isFocused, user?.id, refreshProfile]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const [savedRes, reviewsRes, addedRes] = await Promise.all([
        supabase.from('saved_bathrooms').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('bathrooms').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
      ]);
      // Promise.all resolves even when a query returns { error } instead of
      // throwing, so check each result — otherwise a failed count silently
      // renders as 0 (a plausible-but-wrong stat).
      const failure = savedRes.error ?? reviewsRes.error ?? addedRes.error;
      if (failure) throw failure;
      setStats({
        saved: savedRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        added: addedRes.count ?? 0,
      });
      setStatsError(false);
    } catch (err) {
      console.error('Failed to fetch profile stats:', err);
      setStatsError(true);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isFocused || !user) return;
    fetchStats();
  }, [isFocused, user?.id, fetchStats]);

  const handleLogOut = async () => {
    try {
      await signOut();
      // UserContext.onAuthStateChange fires SIGNED_OUT → AppNavigator routes to ToodaLoo
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'User';
  const goToSaved = () => (navigation as any).getParent()?.navigate('Saved');

  const statTiles: { key: string; label: string; value: number; icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void }[] = [
    { key: 'saved', label: 'Saved', value: stats.saved, icon: 'bookmark-outline', onPress: goToSaved },
    { key: 'reviews', label: 'Reviews', value: stats.reviews, icon: 'star-outline', onPress: () => navigation.navigate('MyReviews') },
    { key: 'added', label: 'Added', value: stats.added, icon: 'map-marker-plus-outline', onPress: () => navigation.navigate('Submitted') },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <ScreenHeader
          variant="large"
          title="Profile"
          right={
            <IconButton icon="cog-outline" accessibilityLabel="Open settings" onPress={() => navigation.navigate('Settings')} />
          }
        />

        {/* Hero section */}
        {isLoadingStats ? (
          <SkeletonProfileHero />
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 12, paddingHorizontal: 16 }}>
            {/* Avatar with brand ring */}
            <View style={{ padding: 4, borderRadius: 52, borderWidth: 2, borderColor: colors.purpleGlow }}>
              <View style={{
                width: 88, height: 88, borderRadius: 44,
                backgroundColor: colors.purple,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 36, color: '#fff' }}>
                  {initial(displayName)}
                </Text>
              </View>
            </View>

            <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22, letterSpacing: -0.5, color: colors.text1, marginTop: 14 }}>
              {displayName}
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text2, marginTop: 2 }}>
              {user?.email ?? ''}
            </Text>

            {/* Stats — or a retry affordance if the counts failed to load,
                so we never render a misleading 0. */}
            {statsError ? (
              <View style={{ marginTop: 20, alignSelf: 'stretch', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingVertical: 16 }}>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text2 }}>
                  Couldn't load your stats
                </Text>
                <Pressable
                  onPress={fetchStats}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading stats"
                  style={({ pressed }: { pressed: boolean }) => ({ marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.purpleText }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' }}>
                {statTiles.map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={t.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.value} ${t.label}`}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flex: 1,
                      backgroundColor: pressed ? colors.surface2 : colors.surface1,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    })}
                  >
                    <MaterialCommunityIcons name={t.icon} size={18} color={colors.purpleText} />
                    <Text style={{ fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text1, letterSpacing: -0.8, marginTop: 8 }}>
                      {String(t.value)}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text2, marginTop: 1 }}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Menu sections */}
        <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
          <ListGroup title="Your activity">
            <MenuItem icon="star-outline" label="My Reviews" onPress={() => navigation.navigate('MyReviews')} />
            <MenuItem icon="map-marker-plus-outline" label="Submitted" sublabel="Bathrooms you've added" onPress={() => navigation.navigate('Submitted')} />
            <MenuItem icon="bookmark-outline" label="Saved Places" onPress={goToSaved} />
          </ListGroup>

          <ListGroup title="Account">
            <MenuItem icon="cog-outline" label="Settings" sublabel="Username, appearance, account" onPress={() => navigation.navigate('Settings')} />
            <MenuItem icon="file-document-outline" label="Terms & Privacy" onPress={openLegal} />
          </ListGroup>

          <ListGroup>
            <MenuItem icon="logout" label="Log Out" onPress={handleLogOut} destructive />
          </ListGroup>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

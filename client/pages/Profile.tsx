import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
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
import { SectionLabel } from '../components/ui/SectionLabel';

type profileScreenProp = NativeStackNavigationProp<ProfileStackParamList>;

export function Profile() {
  const navigation = useNavigation<profileScreenProp>();
  const { colors } = useThemeContext();
  const { user, profile, signOut } = useUser();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState({ saved: 0, reviews: 0, added: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isFocused || !user) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const [savedRes, reviewsRes, addedRes] = await Promise.all([
          supabase.from('saved_bathrooms').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('bathrooms').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        ]);
        setStats({
          saved: savedRes.count ?? 0,
          reviews: reviewsRes.count ?? 0,
          added: addedRes.count ?? 0,
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [isFocused, user?.id]);

  const handleLogOut = async () => {
    try {
      await signOut();
      // UserContext.onAuthStateChange fires SIGNED_OUT → AppNavigator routes to ToodaLoo
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero section */}
        {isLoadingStats ? (
          <SkeletonProfileHero />
        ) : (
          <View style={{
            backgroundColor: colors.surface1,
            alignItems: 'center',
            paddingTop: 40,
            paddingBottom: 28,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            {/* Purple glow behind avatar */}
            <View style={{
              position: 'absolute', top: 20, width: 120, height: 120,
              borderRadius: 60, backgroundColor: colors.purpleDim,
            }} />

            {/* Avatar */}
            <View style={{
              width: 72, height: 72, borderRadius: 22,
              backgroundColor: colors.purple,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
              shadowColor: colors.purpleGlow ?? 'rgba(123,110,246,0.35)',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 1,
              shadowRadius: 22,
              elevation: 8,
            }}>
              <MaterialCommunityIcons name="toilet" size={34} color="#fff" />
            </View>

            <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: colors.text1 }}>
              {profile?.username ?? user?.email?.split('@')[0] ?? 'User'}
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text2, marginTop: 2 }}>
              {user?.email ?? ''}
            </Text>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, alignSelf: 'stretch', marginHorizontal: 24 }}>
              {[
                { stat: String(stats.saved), label: 'SAVED' },
                { stat: String(stats.reviews), label: 'REVIEWS' },
                { stat: String(stats.added), label: 'ADDED' },
              ].map((item, i) => (
                <View key={item.label} style={{
                  flex: 1,
                  alignItems: 'center',
                  borderRightWidth: i < 2 ? 1 : 0,
                  borderRightColor: colors.border,
                }}>
                  <Text style={{ fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text1, letterSpacing: -0.8 }}>
                    {item.stat}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text3, letterSpacing: 1.2, marginTop: 2 }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu sections */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>

          {/* Account */}
          <SectionLabel label="Account" />
          <View style={{ marginTop: 8, backgroundColor: colors.surface1, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <MenuItem
              icon="cog"
              label="Settings"
              sublabel="Username, theme"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>

          {/* Activity */}
          <SectionLabel label="Activity" />
          <View style={{ marginTop: 8, backgroundColor: colors.surface1, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <MenuItem
              icon="bookmark"
              label="Saved Places"
              onPress={() => {
                (navigation as any).getParent()?.navigate('Saved');
              }}
            />
            <MenuItem
              icon="note-text"
              label="My Reviews"
              onPress={() => navigation.navigate('MyReviews')}
            />
            <MenuItem
              icon="map-marker"
              label="Submitted"
              onPress={() => navigation.navigate('Submitted')}
            />
          </View>

          {/* More */}
          <SectionLabel label="More" />
          <View style={{ marginTop: 8, backgroundColor: colors.surface1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            <MenuItem icon="logout" label="Log Out" onPress={handleLogOut} destructive />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

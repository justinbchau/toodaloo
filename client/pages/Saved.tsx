import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { BathroomCard, BathroomCardData } from '../components/BathroomCard';
import { RootStackParamList } from '../RootStackParams';
import { FlashList } from '@shopify/flash-list';

const listStyles = StyleSheet.create({
  contentContainer: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
});

const ACCESS_EMOJI: Record<string, string> = {
  public: '🚽',
  key_required: '🔑',
  purchase_required: '🛒',
};

export function Saved() {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [bathrooms, setBathrooms] = useState<BathroomCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const keyExtractor = useCallback((item: BathroomCardData) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: BathroomCardData }) => (
      <BathroomCard
        data={item}
        onPress={() =>
          navigation.navigate('BathroomDetail', {
            id: item.id,
            name: item.name,
            lat: item.lat,
            lng: item.lng,
          })
        }
      />
    ),
    [navigation]
  );

  const fetchSaved = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('saved_bathrooms')
        .select('bathrooms(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const transformed: BathroomCardData[] = (data ?? [])
        .map((row: any) => row.bathrooms)
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          name: b.name,
          emoji: ACCESS_EMOJI[b.access_type] ?? '🚽',
          sub:
            b.access_type === 'public'
              ? `Public${b.is_24_hours ? ' · Open 24h' : ''}`
              : b.access_type === 'key_required'
              ? 'Key Required'
              : 'Purchase Required',
          rating: Math.round(Number(b.rating_avg) || 0),
          score: (Number(b.rating_avg) || 0).toFixed(1),
          reviewCount: `(${b.review_count ?? 0})`,
          distance: '',
          lat: b.lat,
          lng: b.lng,
        }));

      setBathrooms(transformed);
    } catch (err) {
      console.error('Failed to fetch saved bathrooms:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSaved().finally(() => setIsLoading(false));
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors.text1 }}>
            Saved
          </Text>
        </View>
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  // Empty state
  if (bathrooms.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors.text1, marginBottom: 8 }}>
            Saved
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text2 }}>
            Your saved bathrooms will appear here.
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontFamily: undefined }}>🔖</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: colors.text2, marginTop: 12 }}>
            Nothing saved yet
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.text3, marginTop: 4 }}>
            Tap ⭐ on any bathroom to save it
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Populated state
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 24, paddingBottom: 8 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors.text1, marginBottom: 4 }}>
          Saved
        </Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.text2 }}>
          {bathrooms.length} saved {bathrooms.length === 1 ? 'bathroom' : 'bathrooms'}
        </Text>
      </View>
      <FlashList
        data={bathrooms}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listStyles.contentContainer}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.purple}
            onRefresh={async () => {
              setIsRefreshing(true);
              await fetchSaved();
              setIsRefreshing(false);
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

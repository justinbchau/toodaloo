import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../RootStackParams';
import { BathroomCard, BathroomCardData } from '../components/BathroomCard';
import BackButton from '../components/BackButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACCESS_EMOJI: Record<string, string> = {
  public: '🚽',
  key_required: '🔑',
  purchase_required: '🛒',
};

export function Submitted() {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const navigation = useNavigation<Nav>();

  const [bathrooms, setBathrooms] = useState<BathroomCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchSubmitted = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const { data } = await supabase
            .from('bathrooms')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

          const transformed: BathroomCardData[] = (data ?? []).map((b: any) => ({
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

          if (active) setBathrooms(transformed);
        } catch (err) {
          console.error('Failed to fetch submitted bathrooms:', err);
        } finally {
          if (active) setIsLoading(false);
        }
      };
      fetchSubmitted();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <BackButton />
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: colors.text1 }}>
          Submitted
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : bathrooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📍</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: colors.text2, marginTop: 12 }}>
            Nothing submitted yet
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.text3, marginTop: 4 }}>
            Bathrooms you add will show up here
          </Text>
        </View>
      ) : (
        <FlashList
          data={bathrooms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

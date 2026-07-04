import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../RootStackParams';
import BackButton from '../components/BackButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MyReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  bathroom: { id: string; name: string; lat: number; lng: number } | null;
};

export function MyReviews() {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const navigation = useNavigation<Nav>();

  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchReviews = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const { data } = await supabase
            .from('reviews')
            .select('id, rating, body, created_at, bathroom:bathrooms(id, name, lat, lng)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const normalized: MyReview[] = (data ?? []).map((r: any) => ({
            id: r.id,
            rating: r.rating,
            body: r.body,
            created_at: r.created_at,
            // Supabase returns the joined relation as an object (or array); normalize.
            bathroom: Array.isArray(r.bathroom) ? r.bathroom[0] ?? null : r.bathroom ?? null,
          }));

          if (active) setReviews(normalized);
        } catch (err) {
          console.error('Failed to fetch reviews:', err);
        } finally {
          if (active) setIsLoading(false);
        }
      };
      fetchReviews();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  const renderItem = useCallback(
    ({ item }: { item: MyReview }) => (
      <Pressable
        onPress={() => {
          if (item.bathroom) {
            navigation.navigate('BathroomDetail', {
              id: item.bathroom.id,
              name: item.bathroom.name,
              lat: item.bathroom.lat,
              lng: item.bathroom.lng,
            });
          }
        }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: colors.surface2, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, flex: 1 }} numberOfLines={1}>
            {item.bathroom?.name ?? 'Unknown bathroom'}
          </Text>
          <Text style={{ color: colors.text3, fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={{ color: colors.yellow, fontSize: 13, marginTop: 4 }}>
          {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
        </Text>
        {item.body ? (
          <Text style={{ color: colors.text2, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 6, lineHeight: 18 }}>
            {item.body}
          </Text>
        ) : null}
      </Pressable>
    ),
    [colors, navigation]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <BackButton />
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: colors.text1 }}>
          My Reviews
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📝</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: colors.text2, marginTop: 12 }}>
            No reviews yet
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: colors.text3, marginTop: 4 }}>
            Reviews you write will show up here
          </Text>
        </View>
      ) : (
        <FlashList
          data={reviews}
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

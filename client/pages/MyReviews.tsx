import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../RootStackParams';
import BackButton from '../components/BackButton';
import { ErrorState } from '../components/ErrorState';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, body, created_at, bathroom:bathrooms(id, name, lat, lng)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized: MyReview[] = (data ?? []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        created_at: r.created_at,
        // Supabase returns the joined relation as an object (or array); normalize.
        bathroom: Array.isArray(r.bathroom) ? r.bathroom[0] ?? null : r.bathroom ?? null,
      }));

      setReviews(normalized);
      setHasError(false);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setHasError(true);
    }
  }, [user?.id]);

  // Refetch on focus so newly written/edited reviews reflect on return.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchReviews().finally(() => setIsLoading(false));
    }, [fetchReviews])
  );

  const handleEdit = useCallback(
    (item: MyReview) => {
      if (!item.bathroom) return;
      // WriteReview detects the existing review and opens in edit mode.
      navigation.navigate('WriteReview', {
        bathroomId: item.bathroom.id,
        bathroomName: item.bathroom.name,
      });
    },
    [navigation]
  );

  const handleDelete = useCallback(
    (item: MyReview) => {
      Alert.alert(
        'Delete review?',
        `Your review of ${item.bathroom?.name ?? 'this bathroom'} will be removed permanently.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase.from('reviews').delete().eq('id', item.id);
              if (error) {
                Alert.alert('Error', 'Could not delete your review. Please try again.');
                return;
              }
              setReviews((prev) => prev.filter((r) => r.id !== item.id));
            },
          },
        ]
      );
    },
    []
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
        <View style={styles.actionsRow}>
          {item.bathroom ? (
            <Pressable
              onPress={() => handleEdit(item)}
              accessibilityRole="button"
              accessibilityLabel={`Edit review of ${item.bathroom.name}`}
              style={({ pressed }: { pressed: boolean }) => [
                styles.actionBtn,
                { borderColor: colors.borderMed, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={{ color: colors.text2, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Edit
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`Delete review of ${item.bathroom?.name ?? 'unknown bathroom'}`}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionBtn,
              { borderColor: colors.borderMed, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color: colors.red, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              Delete
            </Text>
          </Pressable>
        </View>
      </Pressable>
    ),
    [colors, navigation, handleEdit, handleDelete]
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
      ) : hasError ? (
        <ErrorState
          title="Couldn't load your reviews"
          retryAccessibilityLabel="Retry loading reviews"
          onRetry={async () => {
            setIsLoading(true);
            await fetchReviews();
            setIsLoading(false);
          }}
        />
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="note-text-outline" size={48} color={colors.text3} />
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={colors.purple}
              onRefresh={async () => {
                setIsRefreshing(true);
                await fetchReviews();
                setIsRefreshing(false);
              }}
            />
          }
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

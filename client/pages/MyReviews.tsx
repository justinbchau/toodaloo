import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../RootStackParams';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StarRating } from '../components/ui/StarRating';
import { relativeDate } from '../lib/format';
import { ErrorState } from '../components/ErrorState';
import { useFocusedFetch } from '../hooks/useFocusedFetch';

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
  const { showToast } = useToast();

  const load = useCallback(async (): Promise<MyReview[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, body, created_at, bathroom:bathrooms(id, name, lat, lng)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      created_at: r.created_at,
      // Supabase returns the joined relation as an object (or array); normalize.
      bathroom: Array.isArray(r.bathroom) ? r.bathroom[0] ?? null : r.bathroom ?? null,
    }));
  }, [user?.id]);

  // Refetch on focus so newly written/edited reviews reflect on return.
  const { data, setData, isLoading, isRefreshing, hasError, refetch, refresh } = useFocusedFetch(load);
  const reviews = data ?? [];

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

  // Optimistic delete with an undo window: the row disappears now, and the
  // DELETE only runs once the toast times out without "Undo" being tapped.
  const handleDelete = useCallback(
    (item: MyReview) => {
      setData((prev) => (prev ?? []).filter((r) => r.id !== item.id));
      showToast({
        message: 'Review deleted',
        icon: 'trash-can-outline',
        actionLabel: 'Undo',
        onAction: () =>
          setData((prev) =>
            [...(prev ?? []).filter((r) => r.id !== item.id), item].sort((x, y) =>
              y.created_at.localeCompare(x.created_at),
            ),
          ),
        onCommit: async () => {
          const { error } = await supabase.from('reviews').delete().eq('id', item.id);
          if (error) {
            Alert.alert('Error', 'Could not delete your review. Please try again.');
            refetch();
          }
        },
      });
    },
    [setData, showToast, refetch]
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
          { backgroundColor: pressed ? colors.surface2 : colors.surface1, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
            <MaterialCommunityIcons name="toilet" size={20} color={colors.text1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }} numberOfLines={1}>
              {item.bathroom?.name ?? 'Unknown bathroom'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <StarRating rating={item.rating} size={13} />
              <Text style={{ color: colors.text3, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {relativeDate(item.created_at)}
              </Text>
            </View>
          </View>
          {item.bathroom ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} /> : null}
        </View>
        {item.body ? (
          <Text style={{ color: colors.text1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 12, lineHeight: 21 }}>
            {item.body}
          </Text>
        ) : (
          <Text style={{ color: colors.text3, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 12, fontStyle: 'italic' }}>
            Rating only — no written review.
          </Text>
        )}
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          {item.bathroom ? (
            <Pressable
              onPress={() => handleEdit(item)}
              accessibilityRole="button"
              accessibilityLabel={`Edit review of ${item.bathroom.name}`}
              hitSlop={6}
              style={({ pressed }: { pressed: boolean }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text2} />
              <Text style={{ color: colors.text2, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Edit
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`Delete review of ${item.bathroom?.name ?? 'unknown bathroom'}`}
            hitSlop={6}
            style={({ pressed }: { pressed: boolean }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.red} />
            <Text style={{ color: colors.red, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              Delete
            </Text>
          </Pressable>
        </View>
      </Pressable>
    ),
    [colors, navigation, handleEdit, handleDelete]
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="My Reviews"
        subtitle={!isLoading && !hasError && reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` : undefined}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : hasError ? (
        <ErrorState
          title="Couldn't load your reviews"
          retryAccessibilityLabel="Retry loading reviews"
          onRetry={refetch}
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title="No reviews yet"
          message="Reviews you write will show up here. Your ratings help everyone find a better bathroom."
          actionLabel="Find a bathroom to review"
          onAction={() => navigation.navigate('MainTabs', { screen: 'Map' })}
        />
      ) : (
        <FlashList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={colors.accent}
              onRefresh={refresh}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const Separator = () => <View style={{ height: 10 }} />;

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

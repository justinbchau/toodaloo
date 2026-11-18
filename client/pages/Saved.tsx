import React, { useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { BathroomCard, BathroomCardData } from '../components/BathroomCard';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SkeletonBathroomCard } from '../components/SkeletonBathroomCard';
import { ACCESS_ICON, DEFAULT_ACCESS_ICON } from '../lib/accessIcons';
import { RootStackParamList } from '../RootStackParams';
import { FlashList } from '@shopify/flash-list';
import { useFocusedFetch } from '../hooks/useFocusedFetch';

const listStyles = StyleSheet.create({
  contentContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 10 },
});

export function Saved() {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const load = useCallback(async (): Promise<BathroomCardData[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('saved_bathrooms')
      .select('bathrooms(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? [])
      .map((row: any) => row.bathrooms)
      .filter(Boolean)
      .map((b: any) => ({
        id: b.id,
        name: b.name,
        icon: ACCESS_ICON[b.access_type] ?? DEFAULT_ACCESS_ICON,
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
  }, [user?.id]);

  // Refetch on focus so newly saved/unsaved bathrooms reflect on return.
  const { data, isLoading, isRefreshing, hasError, refetch, refresh } = useFocusedFetch(load);
  const bathrooms = data ?? [];

  const count = bathrooms.length;
  const header = (
    <ScreenHeader
      variant="large"
      title="Saved"
      subtitle={!isLoading && !hasError && count > 0 ? `${count} saved ${count === 1 ? 'bathroom' : 'bathrooms'}` : 'Your go-to spots, one tap away.'}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={listStyles.contentContainer}>
          <SkeletonBathroomCard />
          <SkeletonBathroomCard />
          <SkeletonBathroomCard />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (hasError) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <ErrorState
          title="Couldn't load your saved places"
          retryAccessibilityLabel="Retry loading saved places"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // Empty state
  if (count === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <EmptyState
          icon="bookmark-outline"
          title="Nothing saved yet"
          message="Tap the bookmark on any bathroom to keep it here for next time."
          actionLabel="Explore the map"
          onAction={() => navigation.navigate('MainTabs', { screen: 'Map' })}
        />
      </SafeAreaView>
    );
  }

  // Populated state
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      <FlashList
        data={bathrooms}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listStyles.contentContainer}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.purple}
            onRefresh={refresh}
          />
        }
      />
    </SafeAreaView>
  );
}

const Separator = () => <View style={{ height: 10 }} />;

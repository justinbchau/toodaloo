import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../RootStackParams';
import { BathroomCard, BathroomCardData } from '../components/BathroomCard';
import { ErrorState } from '../components/ErrorState';
import { toCardData } from '../lib/bathroomCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonBathroomCard } from '../components/SkeletonBathroomCard';
import { useFocusedFetch } from '../hooks/useFocusedFetch';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function Submitted() {
  const { colors } = useThemeContext();
  const { user } = useUser();
  const navigation = useNavigation<Nav>();

  const load = useCallback(async (): Promise<BathroomCardData[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('bathrooms')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((b: any) => toCardData(b));
  }, [user?.id]);

  // Refetch on focus so a newly added bathroom shows on return.
  const { data, isLoading, isRefreshing, hasError, refetch, refresh } = useFocusedFetch(load);
  const bathrooms = data ?? [];

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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Submitted"
        subtitle={!isLoading && !hasError && bathrooms.length > 0 ? `${bathrooms.length} added by you` : undefined}
      />

      {isLoading ? (
        <View style={[styles.listContent, { gap: 10 }]}>
          <SkeletonBathroomCard />
          <SkeletonBathroomCard />
          <SkeletonBathroomCard />
        </View>
      ) : hasError ? (
        <ErrorState
          title="Couldn't load your submissions"
          retryAccessibilityLabel="Retry loading submitted bathrooms"
          onRetry={refetch}
        />
      ) : bathrooms.length === 0 ? (
        <EmptyState
          icon="map-marker-plus-outline"
          title="Nothing submitted yet"
          message="Bathrooms you add will show up here. Know a good one? Put it on the map."
          actionLabel="Add a bathroom"
          onAction={() => navigation.navigate('MainTabs', { screen: 'Add' })}
        />
      ) : (
        <FlashList
          data={bathrooms}
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
});

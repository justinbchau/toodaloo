import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { shadows } from '../theme/shadows';
import { BathroomCard, BathroomCardData } from './BathroomCard';
import { SkeletonBathroomCard } from './SkeletonBathroomCard';
import { NearestCard } from './NearestCard';
import { PrimaryButton } from './ui/PrimaryButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Peek is tall enough for the header + the "Nearest" card on small phones; half
// and full are for browsing. Built on @gorhom/bottom-sheet so dragging the list
// hands off to the sheet (and back) like Apple/Google Maps.
const SNAP_POINTS = [Math.max(280, SCREEN_HEIGHT * 0.33), SCREEN_HEIGHT * 0.55, SCREEN_HEIGHT * 0.86];

interface Props {
  bathrooms?: BathroomCardData[];
  onCardPress?: (id: string) => void;
  isLoading?: boolean;
  /** Empty-state CTA (e.g. jump to the Add tab). */
  onAddPress?: () => void;
  /** Open walking directions for a result (powers the Nearest card). */
  onDirections?: (b: BathroomCardData) => void;
  /** Overrides the empty state, e.g. "Search an area" before any location is known. */
  emptyTitle?: string;
  emptyMessage?: string;
  /** Floating controls pinned just above the sheet's top edge (e.g. recenter). */
  accessory?: React.ReactNode;
}

export function BathroomSheet({
  bathrooms = [],
  onCardPress,
  isLoading = false,
  onAddPress,
  onDirections,
  emptyTitle = 'No bathrooms nearby yet.',
  emptyMessage = 'Add the first one!',
  accessory,
}: Props) {
  const { colors } = useThemeContext();
  const position = useSharedValue(SCREEN_HEIGHT);

  // Ride the accessory on the sheet's top edge; fade it out as the sheet nears full height.
  const accessoryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value - 60 }],
    opacity: interpolate(position.value, [SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.38], [0, 1], Extrapolation.CLAMP),
  }));

  const count = bathrooms.length;
  const [nearest, ...rest] = bathrooms;
  const handleIndicatorStyle = useMemo(() => ({ backgroundColor: colors.surface3, width: 40, height: 5 }), [colors.surface3]);

  return (
    <>
      {accessory ? (
        <Animated.View pointerEvents="box-none" style={[styles.accessory, accessoryStyle]}>
          {accessory}
        </Animated.View>
      ) : null}

      <BottomSheet
        index={0}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        animatedPosition={position}
        handleIndicatorStyle={handleIndicatorStyle}
        backgroundStyle={[styles.background, { backgroundColor: colors.bg, borderColor: colors.cardBorder, shadowColor: colors.shadow }]}
      >
        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: colors.text1 }]}>Nearby bathrooms</Text>
          {!isLoading && count > 0 && (
            <View style={[styles.countPill, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.headingCount, { color: colors.text2 }]}>
                {count} {count === 1 ? 'location' : 'locations'}
              </Text>
            </View>
          )}
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <>
              <SkeletonBathroomCard />
              <SkeletonBathroomCard />
              <SkeletonBathroomCard />
            </>
          ) : count === 0 ? (
            // Compact row layout so the CTA still fits at the peek height.
            <>
              <View style={[styles.emptyRow, { backgroundColor: colors.surface1, borderColor: colors.cardBorder }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.surface2 }]}>
                  <MaterialCommunityIcons testID="empty-state-icon" name="toilet" size={26} color={colors.text1} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: colors.text1 }]}>{emptyTitle}</Text>
                  <Text style={[styles.emptySub, { color: colors.text2 }]}>{emptyMessage}</Text>
                </View>
              </View>
              {onAddPress ? (
                <PrimaryButton title="Add a bathroom" icon="plus" size="md" onPress={onAddPress} />
              ) : null}
            </>
          ) : (
            <>
              {/* The urgent path: one tap to walking directions. */}
              <NearestCard
                data={nearest}
                onDirections={onDirections ? () => onDirections(nearest) : undefined}
                onPress={() => onCardPress?.(nearest.id)}
              />
              {rest.length > 0 && (
                <Text style={[styles.subheading, { color: colors.text2 }]}>More nearby</Text>
              )}
              {rest.map((b) => (
                <BathroomCard key={b.id} data={b} onPress={() => onCardPress?.(b.id)} />
              ))}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  accessory: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  background: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    ...shadows.lg,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 8,
    marginLeft: 4,
  },
  countPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headingCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
});

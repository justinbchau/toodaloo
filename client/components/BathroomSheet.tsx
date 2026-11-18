import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useThemeContext } from '../context/ThemeContext';
import { shadows } from '../theme/shadows';
import { BathroomCard, BathroomCardData } from './BathroomCard';
import { SkeletonBathroomCard } from './SkeletonBathroomCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PrimaryButton } from './ui/PrimaryButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap heights (px from the bottom of the tab screen). Peek shows the header
// plus ~1.5 rows so the map stays the hero; half and full are for browsing.
const SNAPS = [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.52, SCREEN_HEIGHT * 0.8];
const HANDLE_AREA = 22;
const FLICK_VELOCITY = 0.6;

interface Props {
  bathrooms?: BathroomCardData[];
  onCardPress?: (id: string) => void;
  isLoading?: boolean;
  /** Empty-state CTA (e.g. jump to the Add tab). */
  onAddPress?: () => void;
  /** Floating controls pinned just above the sheet's top edge (e.g. recenter). */
  accessory?: React.ReactNode;
}

export function BathroomSheet({ bathrooms = [], onCardPress, isLoading = false, onAddPress, accessory }: Props) {
  const { colors } = useThemeContext();

  const sheetHeight = useRef(new Animated.Value(SNAPS[0])).current;
  const snapIndex = useRef(0);
  const dragStart = useRef(SNAPS[0]);

  const snapTo = useCallback((index: number) => {
    snapIndex.current = index;
    Animated.spring(sheetHeight, {
      toValue: SNAPS[index],
      useNativeDriver: false,
      bounciness: 3,
      speed: 14,
    }).start();
  }, [sheetHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragStart.current = SNAPS[snapIndex.current];
        sheetHeight.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const next = dragStart.current - g.dy;
        sheetHeight.setValue(Math.max(SNAPS[0] * 0.85, Math.min(SNAPS[SNAPS.length - 1] * 1.03, next)));
      },
      onPanResponderRelease: (_, g) => {
        // A tap on the header toggles between peek and half.
        if (Math.abs(g.dy) < 4) {
          snapTo(snapIndex.current === 0 ? 1 : 0);
          return;
        }
        // A flick moves one stop in its direction; a slow drag lands on the nearest stop.
        if (g.vy < -FLICK_VELOCITY) {
          snapTo(Math.min(SNAPS.length - 1, snapIndex.current + 1));
          return;
        }
        if (g.vy > FLICK_VELOCITY) {
          snapTo(Math.max(0, snapIndex.current - 1));
          return;
        }
        const current = dragStart.current - g.dy;
        let nearest = 0;
        SNAPS.forEach((s, i) => {
          if (Math.abs(s - current) < Math.abs(SNAPS[nearest] - current)) nearest = i;
        });
        snapTo(nearest);
      },
    }),
  ).current;

  const count = bathrooms.length;

  return (
    <Animated.View style={[styles.wrapper, { height: sheetHeight }]}>
      {accessory ? <View style={styles.accessory} pointerEvents="box-none">{accessory}</View> : null}

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.bg, borderColor: colors.border, shadowColor: colors.shadow },
        ]}
      >
        {/* Drag area: grabber + header */}
        <View {...panResponder.panHandlers}>
          <View style={styles.handleArea}>
            <View style={[styles.handle, { backgroundColor: colors.surface3 }]} />
          </View>
          <View style={styles.headingRow}>
            <Text style={[styles.heading, { color: colors.text1 }]}>Nearby bathrooms</Text>
            {!isLoading && count > 0 && (
              <View style={[styles.countPill, { backgroundColor: colors.purpleDim }]}>
                <Text style={[styles.headingCount, { color: colors.purpleText }]}>
                  {count} {count === 1 ? 'location' : 'locations'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.list}>
            <SkeletonBathroomCard />
            <SkeletonBathroomCard />
            <SkeletonBathroomCard />
          </View>
        ) : count === 0 ? (
          // Compact row layout so the CTA still fits at the peek height.
          <View style={styles.list}>
            <View style={[styles.emptyRow, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.purpleDim }]}>
                <MaterialCommunityIcons testID="empty-state-icon" name="toilet" size={26} color={colors.purpleText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.emptyTitle, { color: colors.text1 }]}>No bathrooms nearby yet.</Text>
                <Text style={[styles.emptySub, { color: colors.text2 }]}>Add the first one!</Text>
              </View>
            </View>
            {onAddPress ? (
              <PrimaryButton title="Add a bathroom" icon="plus" size="md" onPress={onAddPress} />
            ) : null}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {bathrooms.map((b, i) => (
              <BathroomCard
                key={b.id}
                data={b}
                highlighted={i === 0}
                onPress={() => onCardPress?.(b.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  accessory: {
    position: 'absolute',
    top: -60,
    left: 16,
    right: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    ...shadows.lg,
  },
  handleArea: {
    height: HANDLE_AREA,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
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

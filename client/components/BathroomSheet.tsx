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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { BathroomCard, BathroomCardData } from './BathroomCard';
import { SkeletonBathroomCard } from './SkeletonBathroomCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap positions as fractions of screen height (measured from bottom of screen)
const SNAP_25 = SCREEN_HEIGHT * 0.25;
const SNAP_50 = SCREEN_HEIGHT * 0.50;

const DRAG_HANDLE_HEIGHT = 28; // visual height of the handle area
const DRAG_THRESHOLD = 60; // px of drag before snapping to next position

interface Props {
  bathrooms?: BathroomCardData[];
  onCardPress?: (id: string) => void;
  isLoading?: boolean;
}

export function BathroomSheet({ bathrooms = [], onCardPress, isLoading = false }: Props) {
  const { colors } = useThemeContext();

  // sheetHeight drives the height of the sheet
  const sheetHeight = useRef(new Animated.Value(SNAP_25)).current;
  const currentSnap = useRef<'25' | '50'>('25');
  const dragStartHeight = useRef(SNAP_25);

  const snapTo = useCallback((target: number, label: '25' | '50') => {
    currentSnap.current = label;
    Animated.spring(sheetHeight, {
      toValue: target,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  }, [sheetHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        // Capture the current animated value before dragging
        dragStartHeight.current =
          currentSnap.current === '25' ? SNAP_25 : SNAP_50;
        sheetHeight.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // dy is positive when dragging DOWN, so subtract to shrink/grow
        const next = dragStartHeight.current - gestureState.dy;
        const clamped = Math.max(SNAP_25 * 0.9, Math.min(SNAP_50 * 1.05, next));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const draggingUp = gestureState.dy < -DRAG_THRESHOLD;
        const draggingDown = gestureState.dy > DRAG_THRESHOLD;

        if (currentSnap.current === '25' && draggingUp) {
          snapTo(SNAP_50, '50');
        } else if (currentSnap.current === '50' && draggingDown) {
          snapTo(SNAP_25, '25');
        } else {
          // Snap back to current position
          snapTo(
            currentSnap.current === '25' ? SNAP_25 : SNAP_50,
            currentSnap.current,
          );
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height: sheetHeight,
          backgroundColor: colors.surface1,
          borderColor: colors.borderMed ?? 'rgba(255,255,255,0.08)',
        },
      ]}
    >
      {/* Drag handle */}
      <View style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={[styles.handle, { backgroundColor: colors.surface3 }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: colors.text2 }]}>NEARBY</Text>
          {!isLoading && bathrooms.length > 0 && (
            <Text style={[styles.headingCount, { color: colors.purpleText }]}>
              {bathrooms.length} {bathrooms.length === 1 ? 'location' : 'locations'}
            </Text>
          )}
        </View>

        {isLoading ? (
          /* Loading: 3 skeleton cards */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
          >
            <SkeletonBathroomCard />
            <SkeletonBathroomCard />
            <SkeletonBathroomCard />
          </ScrollView>
        ) : bathrooms.length === 0 ? (
          /* Empty state */
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
            <MaterialCommunityIcons testID="empty-state-icon" name="toilet" size={40} color={colors.text3} />
            <Text style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 15, color: colors.text1,
              marginTop: 12, textAlign: 'center',
            }}>
              No bathrooms nearby yet.
            </Text>
            <Text style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              fontSize: 13, color: colors.text2,
              marginTop: 4, textAlign: 'center',
            }}>
              Add the first one!
            </Text>
          </View>
        ) : (
          /* Real data */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
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
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 12,
  },
  handleArea: {
    height: DRAG_HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
  },
  headingCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  scroll: {
    paddingBottom: 4,
  },
});

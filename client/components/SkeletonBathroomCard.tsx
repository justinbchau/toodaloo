import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeContext } from '../context/ThemeContext';
import { useSkeletonOpacity } from '../hooks/useSkeletonOpacity';

/** Placeholder matching BathroomCard's row layout. */
export function SkeletonBathroomCard() {
  const { colors } = useThemeContext();
  const animatedStyle = useSkeletonOpacity();
  const shimmer = { backgroundColor: colors.surface3, borderRadius: 5 };

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: colors.surface1, borderColor: colors.cardBorder }, animatedStyle]}
    >
      <View style={[shimmer, styles.tile]} />
      <View style={{ flex: 1, gap: 7 }}>
        <View style={[shimmer, { height: 12, width: '70%' }]} />
        <View style={[shimmer, { height: 10, width: '45%' }]} />
        <View style={[shimmer, { height: 10, width: '60%' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  tile: { width: 56, height: 56, borderRadius: 14 },
});

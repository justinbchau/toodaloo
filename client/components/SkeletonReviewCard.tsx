import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeContext } from '../context/ThemeContext';
import { useSkeletonOpacity } from '../hooks/useSkeletonOpacity';

export function SkeletonReviewCard() {
  const { colors } = useThemeContext();
  const animatedStyle = useSkeletonOpacity();

  const shimmer = { backgroundColor: colors.surface3, borderRadius: 4 };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface2, borderRadius: 14 },
        animatedStyle,
      ]}
    >
      {/* Header row: author + date */}
      <View style={styles.headerRow}>
        <View style={[shimmer, { height: 12, width: 100 }]} />
        <View style={[shimmer, { height: 10, width: 60 }]} />
      </View>
      {/* Stars */}
      <View style={[shimmer, { height: 10, width: 80, marginTop: 8 }]} />
      {/* Body text lines */}
      <View style={[shimmer, { height: 10, width: '100%', marginTop: 10 }]} />
      <View style={[shimmer, { height: 10, width: '85%', marginTop: 6 }]} />
      <View style={[shimmer, { height: 10, width: '70%', marginTop: 6 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

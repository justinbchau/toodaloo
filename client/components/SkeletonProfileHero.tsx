import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeContext } from '../context/ThemeContext';
import { useSkeletonOpacity } from '../hooks/useSkeletonOpacity';

export function SkeletonProfileHero() {
  const { colors } = useThemeContext();
  const animatedStyle = useSkeletonOpacity();

  const shimmer = { backgroundColor: colors.surface3, borderRadius: 6 };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Avatar circle */}
      <View style={[shimmer, { width: 96, height: 96, borderRadius: 48, marginBottom: 16 }]} />
      {/* Name line */}
      <View style={[shimmer, { height: 16, width: 140, marginBottom: 8 }]} />
      {/* Email line */}
      <View style={[shimmer, { height: 11, width: 180, marginBottom: 20 }]} />
      {/* Stat tiles */}
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.statCell, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
            <View style={[shimmer, { height: 16, width: 16, marginBottom: 10 }]} />
            <View style={[shimmer, { height: 18, width: 32, marginBottom: 6 }]} />
            <View style={[shimmer, { height: 9, width: 48 }]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
  },
  statCell: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
});

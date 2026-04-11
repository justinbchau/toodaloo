import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export function SkeletonReviewCard() {
  const { colors } = useThemeContext();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  const shimmer = { backgroundColor: colors.surface3, borderRadius: 4 };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface2, borderRadius: 14, opacity },
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

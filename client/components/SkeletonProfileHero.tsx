import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export function SkeletonProfileHero() {
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

  const shimmer = { backgroundColor: colors.surface3, borderRadius: 6 };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          opacity,
        },
      ]}
    >
      {/* Avatar circle */}
      <View
        style={[
          shimmer,
          { width: 72, height: 72, borderRadius: 22, marginBottom: 14 },
        ]}
      />
      {/* Name line */}
      <View style={[shimmer, { height: 14, width: 140, marginBottom: 8 }]} />
      {/* Handle line */}
      <View style={[shimmer, { height: 11, width: 100, marginBottom: 20 }]} />
      {/* Stats row */}
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statCell}>
            <View style={[shimmer, { height: 18, width: 36, marginBottom: 6 }]} />
            <View style={[shimmer, { height: 9, width: 50 }]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
});

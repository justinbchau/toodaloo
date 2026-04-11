import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export function SkeletonBathroomCard() {
  const { colors } = useThemeContext();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  const shimmerStyle = {
    backgroundColor: colors.surface3,
    borderRadius: 4,
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface2,
          borderColor: colors.border,
          opacity,
        },
      ]}
    >
      {/* Emoji placeholder */}
      <View style={[shimmerStyle, styles.emoji]} />
      {/* Name placeholder */}
      <View style={[shimmerStyle, styles.nameLine]} />
      <View style={[shimmerStyle, styles.nameLineShort]} />
      {/* Sub text placeholder */}
      <View style={[shimmerStyle, styles.subLine]} />
      {/* Stars placeholder */}
      <View style={[shimmerStyle, styles.starsLine]} />
      {/* Distance placeholder */}
      <View style={[shimmerStyle, styles.distanceLine]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
  },
  emoji: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginBottom: 10,
  },
  nameLine: {
    height: 10,
    width: '90%',
    marginBottom: 4,
  },
  nameLineShort: {
    height: 10,
    width: '60%',
    marginBottom: 10,
  },
  subLine: {
    height: 8,
    width: '80%',
    marginBottom: 12,
  },
  starsLine: {
    height: 8,
    width: '70%',
    marginBottom: 6,
  },
  distanceLine: {
    height: 8,
    width: '50%',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeContext } from '../context/ThemeContext';
import { useSkeletonOpacity } from '../hooks/useSkeletonOpacity';

/** Placeholder matching BathroomDetail's layout (hero → title → actions → sections). */
export function SkeletonDetail({ heroHeight }: { heroHeight: number }) {
  const { colors } = useThemeContext();
  const pulse = useSkeletonOpacity();
  const block = { backgroundColor: colors.surface3, borderRadius: 8 };

  return (
    <Animated.View style={[{ flex: 1 }, pulse]}>
      <View style={{ height: heroHeight, backgroundColor: colors.surface2 }} />
      <View style={styles.body}>
        <View style={[block, { width: 70, height: 22, borderRadius: 10 }]} />
        <View style={[block, { width: '80%', height: 28, marginTop: 14 }]} />
        <View style={[block, { width: '50%', height: 28, marginTop: 8 }]} />
        <View style={[block, { width: '60%', height: 14, marginTop: 14 }]} />
        <View style={[block, { height: 54, borderRadius: 16, marginTop: 22 }]} />
        <View style={styles.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[block, { flex: 1, height: 64, borderRadius: 16 }]} />
          ))}
        </View>
        <View style={[block, { width: 120, height: 18, marginTop: 36 }]} />
        <View style={styles.tiles}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[block, { width: 96, height: 36, borderRadius: 18 }]} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, marginTop: -8 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 10 },
});

import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export interface BathroomCardData {
  id: string;
  name: string;
  emoji: string;        // e.g. '🏨'
  sub: string;          // e.g. 'Public · Open 24h'
  rating: number;       // 1-5
  score: string;        // e.g. '4.8'
  reviewCount: string;  // e.g. '(124)'
  distance: string;     // e.g. '120m away'
  lat: number;          // for navigation to BathroomDetail
  lng: number;          // for navigation to BathroomDetail
}

interface Props {
  data: BathroomCardData;
  onPress?: () => void;
  highlighted?: boolean;
}

export const BathroomCard = React.memo(function BathroomCard({ data, onPress, highlighted }: Props) {
  const { colors } = useThemeContext();
  const filled = Math.round(data.rating);
  const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        {
          backgroundColor: highlighted ? colors.purpleDim : colors.surface2,
          borderColor: highlighted ? 'rgba(123,110,246,0.28)' : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* 1. Emoji */}
      <Text style={styles.emoji}>{data.emoji}</Text>

      {/* 2. Name */}
      <Text style={[styles.name, { color: colors.text1 }]} numberOfLines={2}>
        {data.name}
      </Text>

      {/* 3. Sub-text */}
      <Text style={[styles.sub, { color: colors.text3 }]} numberOfLines={1}>
        {data.sub}
      </Text>

      {/* 4. Stars + score + count */}
      <View style={styles.ratingRow}>
        <Text style={[styles.stars, { color: colors.yellow }]}>{stars}</Text>
        <Text style={[styles.score, { color: colors.text1 }]}>{data.score}</Text>
        <Text style={[styles.count, { color: colors.text3 }]}>{data.reviewCount}</Text>
      </View>

      {/* 5. Distance */}
      <Text style={[styles.distance, { color: colors.purpleText }]}>
        {data.distance}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 7,
  },
  name: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 2,
    lineHeight: 12 * 1.2,
  },
  sub: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginBottom: 9,
    lineHeight: 10 * 1.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  stars: {
    fontSize: 9,
    fontFamily: undefined,
  },
  score: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  count: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  distance: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

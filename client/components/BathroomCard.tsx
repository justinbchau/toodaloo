import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { StarRating } from './ui/StarRating';

export interface BathroomCardData {
  id: string;
  name: string;
  icon: string;         // MaterialCommunityIcons glyph name, e.g. 'toilet'
  sub: string;          // e.g. 'Public · Open 24h'
  rating: number;       // 1-5
  score: string;        // e.g. '4.8'
  reviewCount: string;  // e.g. '(124)'
  distance: string;     // e.g. '120m away'
  lat: number;          // for navigation to BathroomDetail
  lng: number;          // for navigation to BathroomDetail
  /** Open/closed state from opening hours (see lib/hours). */
  openState?: 'open' | 'closing_soon' | 'closed' | 'unknown';
  /** e.g. "Open · Closes 9 PM", "Open 24 hours"; empty when unknown. */
  statusText?: string;
}

/** Status text colour: green open, amber closing soon, red closed. */
export function statusColor(state: BathroomCardData['openState'], colors: { green: string; yellow: string; red: string; text2: string }) {
  return state === 'open' ? colors.green : state === 'closing_soon' ? colors.yellow : state === 'closed' ? colors.red : colors.text2;
}

interface Props {
  data: BathroomCardData;
  onPress?: () => void;
  /** Brand-tinted border — used for the closest result on the map sheet. */
  highlighted?: boolean;
}

/**
 * List row for a bathroom: access-type tile · name / access line / rating ·
 * distance. Used by the map sheet, Saved and Submitted so every list of
 * bathrooms scans the same way.
 */
export const BathroomCard = React.memo(function BathroomCard({ data, onPress, highlighted }: Props) {
  const { colors } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${data.name}, ${data.sub}, rated ${data.score}`}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.surface2 : colors.surface1,
          borderColor: highlighted ? colors.accentGlow : colors.cardBorder,
        },
      ]}
    >
      {/* 1. Access-type tile */}
      <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
        <MaterialCommunityIcons
          testID="bathroom-card-icon"
          name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={colors.text1}
        />
      </View>

      <View style={styles.body}>
        {/* 2. Name */}
        <Text style={[styles.name, { color: colors.text1 }]} numberOfLines={1}>
          {data.name}
        </Text>

        {/* 3. Access / hours line */}
        <Text style={[styles.sub, { color: colors.text2 }]} numberOfLines={1}>
          {data.sub}
          {data.statusText ? (
            <>
              {' · '}
              <Text style={{ color: statusColor(data.openState, colors), fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                {data.statusText}
              </Text>
            </>
          ) : null}
        </Text>

        {/* 4. Stars + score + count · distance */}
        <View style={styles.metaRow}>
          <StarRating rating={data.rating} size={12} />
          <Text style={[styles.score, { color: colors.text1 }]}>{data.score}</Text>
          <Text style={[styles.count, { color: colors.text3 }]}>{data.reviewCount}</Text>
          {data.distance ? (
            <>
              <View style={[styles.dot, { backgroundColor: colors.text3 }]} />
              <MaterialCommunityIcons name="walk" size={13} color={colors.text2} />
              <Text style={[styles.distance, { color: colors.text2 }]} numberOfLines={1}>
                {data.distance}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    paddingRight: 10,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  score: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginLeft: 2,
  },
  count: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  distance: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flexShrink: 1,
  },
});

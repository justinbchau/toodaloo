import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { BathroomCardData, statusColor } from './BathroomCard';
import { StarRating } from './ui/StarRating';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { IconButton } from './ui/IconButton';

interface Props {
  data: BathroomCardData;
  /** Label above the name — "Nearest to you" in the sheet, omitted for a tapped pin. */
  eyebrow?: string;
  onDirections?: () => void;
  onPress?: () => void;
  /** Shows a close button (used by the map pin preview). */
  onClose?: () => void;
}

/**
 * A single bathroom with its primary actions inline: the sheet's "Nearest"
 * hero and the floating preview shown when a map pin is tapped.
 */
export function NearestCard({ data, eyebrow = 'Nearest to you', onDirections, onPress, onClose }: Props) {
  const { colors } = useThemeContext();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface1, borderColor: colors.cardBorder }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${data.name}, ${data.distance}`}
        style={styles.top}
      >
        <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
          <MaterialCommunityIcons
            name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={24}
            color={colors.text1}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <View style={styles.eyebrowRow}>
              <MaterialCommunityIcons name="navigation-variant" size={12} color={colors.accentText} />
              <Text style={[styles.eyebrow, { color: colors.accentText }]}>{eyebrow}</Text>
            </View>
          ) : null}
          <Text style={[styles.name, { color: colors.text1 }]} numberOfLines={1}>{data.name}</Text>
          <View style={styles.metaRow}>
            <StarRating rating={data.rating} size={12} />
            <Text style={[styles.score, { color: colors.text1 }]}>{data.score}</Text>
            <View style={[styles.dot, { backgroundColor: colors.text3 }]} />
            <Text style={[styles.meta, { color: colors.text2 }]} numberOfLines={1}>
              {data.statusText ? (
                <Text style={{ color: statusColor(data.openState, colors), fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {data.statusText}
                </Text>
              ) : data.sub}
            </Text>
          </View>
        </View>
        {onClose ? (
          <IconButton icon="close" size={32} accessibilityLabel="Close preview" onPress={onClose} />
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        {onDirections ? (
          <PrimaryButton
            title={data.distance ? `Directions · ${data.distance}` : 'Directions'}
            icon="walk"
            size="md"
            onPress={onDirections}
            style={{ flex: 1 }}
            accessibilityLabel={`Walking directions to ${data.name}`}
          />
        ) : null}
        <SecondaryButton title="Details" size="md" onPress={onPress ?? (() => {})} style={{ paddingHorizontal: 18 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 12, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  eyebrow: { fontSize: 11, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 0.6, textTransform: 'uppercase' },
  name: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  score: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  meta: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 10 },
});

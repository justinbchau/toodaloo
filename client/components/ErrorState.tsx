import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import type { IconName } from './ui/IconButton';

type ErrorStateProps = {
  /** Headline, e.g. "Couldn't load your saved places". */
  title: string;
  /** Secondary line; defaults to the standard connection hint. */
  message?: string;
  /** Invoked when the user taps Retry. */
  onRetry: () => void;
  /** Leading icon; defaults to a disconnected-cloud glyph. */
  icon?: IconName;
  /** Retry button copy. */
  retryLabel?: string;
  /** a11y label for the retry button; defaults to `retryLabel`. */
  retryAccessibilityLabel?: string;
};

/**
 * Full-bleed, centered error state with a Retry affordance — the shared shape
 * behind every list screen's fetch-failure UI. Mirrors EmptyState (tinted icon
 * circle → title → subtitle) so a failed load reads as a recoverable error,
 * not silent emptiness. Fills its parent, so drop it into a screen's body
 * below the header.
 */
export function ErrorState({
  title,
  message = 'Check your connection and try again.',
  onRetry,
  icon = 'cloud-off-outline',
  retryLabel = 'Retry',
  retryAccessibilityLabel,
}: ErrorStateProps) {
  const { colors } = useThemeContext();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.redDim,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <MaterialCommunityIcons name={icon} size={38} color={colors.red} />
      </View>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_700Bold',
          fontSize: 18,
          color: colors.text1,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_400Regular',
          fontSize: 14,
          color: colors.text2,
          marginTop: 6,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryAccessibilityLabel ?? retryLabel}
        style={({ pressed }: { pressed: boolean }) => ({
          marginTop: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.surface1,
          borderWidth: 1,
          borderColor: colors.borderMed,
          borderRadius: 14,
          paddingHorizontal: 22,
          height: 46,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <MaterialCommunityIcons name="refresh" size={18} color={colors.text1} />
        <Text style={{ color: colors.text1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>
          {retryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

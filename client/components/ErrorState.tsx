import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

type ErrorStateProps = {
  /** Headline, e.g. "Couldn't load your saved places". */
  title: string;
  /** Secondary line; defaults to the standard connection hint. */
  message?: string;
  /** Invoked when the user taps Retry. */
  onRetry: () => void;
  /** Leading emoji glyph; defaults to a warning sign. */
  emoji?: string;
  /** Retry button copy. */
  retryLabel?: string;
  /** a11y label for the retry button; defaults to `retryLabel`. */
  retryAccessibilityLabel?: string;
};

/**
 * Full-bleed, centered error state with a Retry affordance — the shared shape
 * behind every list screen's fetch-failure UI. Mirrors the empty-state look
 * (large glyph → title → subtitle) so a failed load reads as a recoverable
 * error, not silent emptiness. Fills its parent, so drop it into a screen's
 * body below the header.
 */
export function ErrorState({
  title,
  message = 'Check your connection and try again.',
  onRetry,
  emoji = '⚠️',
  retryLabel = 'Retry',
  retryAccessibilityLabel,
}: ErrorStateProps) {
  const { colors } = useThemeContext();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 16,
          color: colors.text1,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_400Regular',
          fontSize: 13,
          color: colors.text3,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryAccessibilityLabel ?? retryLabel}
        style={({ pressed }: { pressed: boolean }) => ({
          marginTop: 20,
          backgroundColor: colors.purple,
          borderRadius: 12,
          paddingHorizontal: 24,
          paddingVertical: 12,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
          {retryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

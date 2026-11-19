import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  /** 0-5; rounded to the nearest whole star. */
  rating: number;
  size?: number;
  color?: string;
  style?: TextStyle;
}

/** Read-only five-star string, e.g. ★★★★☆. One Text node so it stays crisp and cheap. */
export function StarRating({ rating, size = 13, color, style }: Props) {
  const { colors } = useThemeContext();
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <Text
      accessibilityLabel={`${filled} out of 5 stars`}
      style={[{ color: color ?? colors.yellow, fontSize: size, letterSpacing: size * 0.08 }, style]}
    >
      {'★'.repeat(filled) + '☆'.repeat(5 - filled)}
    </Text>
  );
}

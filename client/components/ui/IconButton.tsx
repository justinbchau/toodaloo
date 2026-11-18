import React from 'react';
import { Pressable, View, Text, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { shadows } from '../../theme/shadows';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Props {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  /**
   * surface — tinted circle on a page background (headers).
   * glass   — opaque, shadowed chrome for floating over a map/photo.
   * primary — brand-filled.
   */
  variant?: 'surface' | 'glass' | 'primary';
  size?: number;
  iconColor?: string;
  /** Small count badge in the top-right corner. */
  badge?: number;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 40,
  iconColor,
  badge,
  disabled,
  style,
  testID,
}: Props) {
  const { colors } = useThemeContext();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'glass' ? colors.glass : colors.surface2;
  const fg = iconColor ?? (variant === 'primary' ? colors.onPrimary : colors.text1);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }: { pressed: boolean }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        variant === 'glass' && { ...shadows.md, shadowColor: colors.shadow },
        variant === 'primary' && { ...shadows.md, shadowColor: colors.shadow },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={Math.round(size * 0.5)} color={fg} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.accent,
            borderWidth: 2,
            borderColor: colors.surface1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.onAccent, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

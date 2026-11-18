import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { IconName } from './IconButton';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 'brand' tints the icon purple; 'danger' red; 'success' green. */
  tone?: 'brand' | 'danger' | 'success' | 'neutral';
  iconTestID?: string;
  compact?: boolean;
}

/**
 * Centered illustration → title → message → optional CTA. The shared shape for
 * every empty, error and confirmation state so they read as one family.
 */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  tone = 'brand',
  iconTestID,
  compact,
}: Props) {
  const { colors } = useThemeContext();
  const tint = {
    brand: { bg: colors.purpleDim, fg: colors.purpleText },
    danger: { bg: colors.redDim, fg: colors.red },
    success: { bg: colors.greenDim, fg: colors.green },
    neutral: { bg: colors.surface2, fg: colors.text2 },
  }[tone];
  const circle = compact ? 64 : 88;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingVertical: compact ? 16 : 32 }}>
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: tint.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: compact ? 14 : 20,
        }}
      >
        <MaterialCommunityIcons testID={iconTestID} name={icon} size={compact ? 30 : 40} color={tint.fg} />
      </View>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_700Bold',
          fontSize: compact ? 16 : 19,
          color: colors.text1,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 14,
            color: colors.text2,
            marginTop: 6,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton title={actionLabel} onPress={onAction} size="md" style={{ marginTop: 22, paddingHorizontal: 28 }} />
      ) : null}
    </View>
  );
}

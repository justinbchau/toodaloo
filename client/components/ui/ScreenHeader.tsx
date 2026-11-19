import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../context/ThemeContext';
import { IconButton, IconName } from './IconButton';

interface Props {
  title: string;
  subtitle?: string;
  /**
   * large  — tab-root style: big left-aligned title, no back button.
   * inline — pushed-screen style: back button + compact title.
   */
  variant?: 'large' | 'inline';
  /** Leading button icon for inline headers (defaults to a back chevron). */
  leadingIcon?: IconName;
  onLeadingPress?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  variant = 'inline',
  leadingIcon = 'chevron-left',
  onLeadingPress,
  right,
}: Props) {
  const { colors } = useThemeContext();
  const navigation = useNavigation();

  if (variant === 'large') {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, letterSpacing: -1, color: colors.text1 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: colors.text2, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, minHeight: 56 }}>
      <IconButton
        icon={leadingIcon}
        accessibilityLabel={leadingIcon === 'close' ? 'Close' : 'Go back'}
        onPress={onLeadingPress ?? (() => navigation.goBack())}
      />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: colors.text1 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.text2, marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {/* Keep the title optically centred when there's no trailing action. */}
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

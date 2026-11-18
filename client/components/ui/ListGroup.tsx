import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * iOS-style inset grouped list: an optional caption, a rounded card of rows,
 * and an optional footnote. Tells the last child it's last so it can drop its
 * divider.
 */
export function ListGroup({ title, footer, children, style }: Props) {
  const { colors } = useThemeContext();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginBottom: 24 }, style]}>
      {title ? (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 13,
            color: colors.text2,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface1,
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {items.map((child, i) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<{ isLast?: boolean }>, { isLast: i === items.length - 1 })
            : child,
        )}
      </View>
      {footer ? (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 12,
            color: colors.text3,
            marginTop: 8,
            marginHorizontal: 4,
            lineHeight: 17,
          }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

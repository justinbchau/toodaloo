import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Icon tile tint; defaults to the brand purple. */
  tint?: string;
  /** Trailing value text (e.g. a count) shown before the chevron. */
  value?: string;
  /** Custom trailing node (e.g. a Switch); replaces value + chevron. */
  right?: React.ReactNode;
  /** Set by ListGroup — hides the hairline under the last row. */
  isLast?: boolean;
  testID?: string;
}

export function MenuItem({ icon, label, sublabel, onPress, destructive, tint, value, right, isLast, testID }: Props) {
  const { colors } = useThemeContext();
  const iconColor = destructive ? colors.red : tint ?? colors.purpleText;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }: { pressed: boolean }) => [styles.row, { backgroundColor: pressed && onPress ? colors.surface2 : 'transparent' }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.redDim : colors.purpleDim }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <View style={[styles.body, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderMed }]}>
        <View style={styles.text}>
          <Text style={[styles.label, { color: destructive ? colors.red : colors.text1 }]}>{label}</Text>
          {sublabel ? <Text style={[styles.sublabel, { color: colors.text2 }]}>{sublabel}</Text> : null}
        </View>
        {right ?? (
          <>
            {value ? <Text style={[styles.value, { color: colors.text2 }]}>{value}</Text> : null}
            {onPress && !destructive ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text3} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingRight: 14,
    minHeight: 54,
  },
  text: { flex: 1 },
  label: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sublabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});

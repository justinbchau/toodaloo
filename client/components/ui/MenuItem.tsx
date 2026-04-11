import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

interface Props {
  icon: string;       // emoji or character
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export function MenuItem({ icon, label, sublabel, onPress, destructive }: Props) {
  const { colors } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: destructive ? 'rgba(240,90,90,0.12)' : colors.surface2 }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: destructive ? colors.red : colors.text1 }]}>{label}</Text>
        {sublabel ? <Text style={[styles.sublabel, { color: colors.text3 }]}>{sublabel}</Text> : null}
      </View>
      <Text style={[styles.chevron, { color: colors.text3 }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 18, fontFamily: undefined },
  text: { flex: 1 },
  label: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sublabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 1,
  },
  chevron: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});

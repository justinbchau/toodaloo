import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';

export default function BackButton() {
  const navigation = useNavigation();
  const { colors } = useThemeContext();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.btn, { backgroundColor: colors.surface2 }]}
      >
        <Text style={[styles.icon, { color: colors.text1 }]}>‹</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 28, lineHeight: 32 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export function Success() {
  const navigation = useNavigation<RootNavProp>();
  const { colors } = useThemeContext();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        <Text style={[styles.emoji]}>🚽</Text>
        <Text style={[styles.heading, { color: colors.text1 }]}>
          Bathroom added!
        </Text>
        <Text style={[styles.subtext, { color: colors.text2 }]}>
          Thanks for helping the community find a good spot.
        </Text>
        <View style={styles.button}>
          <PrimaryButton
            title="Back to Map"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Map' })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  heading: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});

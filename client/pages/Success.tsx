import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../RootStackParams';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const NEXT_STEPS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[] = [
  { icon: 'map-marker-check-outline', text: "It's live on the map for everyone nearby." },
  { icon: 'star-outline', text: 'Others can now rate and review it.' },
  { icon: 'account-heart-outline', text: 'It counts toward your Added total.' },
];

export function Success() {
  const navigation = useNavigation<RootNavProp>();
  const { colors } = useThemeContext();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        {/* Double-ring check badge */}
        <View style={[styles.ringOuter, { backgroundColor: colors.greenDim }]}>
          <View style={[styles.ringInner, { backgroundColor: colors.green }]}>
            <MaterialCommunityIcons name="check-bold" size={44} color="#fff" />
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.text1 }]}>Bathroom added!</Text>
        <Text style={[styles.subtext, { color: colors.text2 }]}>
          Thanks for helping the community find a good spot.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface1, borderColor: colors.cardBorder }]}>
          {NEXT_STEPS.map((step) => (
            <View key={step.text} style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.surface2 }]}>
                <MaterialCommunityIcons name={step.icon} size={18} color={colors.text1} />
              </View>
              <Text style={[styles.stepText, { color: colors.text1 }]}>{step.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Back to Map"
          icon="map-outline"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Map' })}
        />
        <SecondaryButton
          title="Add another"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Add' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ringOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ringInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 30,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 300,
  },
  card: {
    alignSelf: 'stretch',
    marginTop: 32,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 19 },
  actions: { paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
});

import React from 'react';
import { Text, View, StyleSheet, DimensionValue } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { Fade } from '../components/ui/Fade';
import { shadows } from '../theme/shadows';
import { openLegal } from '../lib/legalUrl';

type homeScreenProp = StackNavigationProp<RootStackParamList, 'ToodaLoo'>;

// Illustrated street grid for the hero — percentages so it scales to any device.
const ROADS_H: DimensionValue[] = ['22%', '48%', '74%'];
const ROADS_V: DimensionValue[] = ['18%', '46%', '78%'];
const BLOCKS: { top: DimensionValue; left: DimensionValue; width: DimensionValue; height: DimensionValue }[] = [
  { top: '4%', left: '0%', width: '16%', height: '16%' },
  { top: '4%', left: '20%', width: '24%', height: '16%' },
  { top: '4%', left: '48%', width: '28%', height: '16%' },
  { top: '26%', left: '20%', width: '24%', height: '20%' },
  { top: '26%', left: '80%', width: '20%', height: '20%' },
  { top: '52%', left: '0%', width: '16%', height: '20%' },
  { top: '52%', left: '48%', width: '28%', height: '20%' },
  { top: '78%', left: '20%', width: '24%', height: '20%' },
];

const PINS = [
  { top: '19%', left: '30%', score: '4.8' },
  { top: '42%', left: '62%', score: '4.5' },
  { top: '30%', left: '86%', score: null },
  { top: '13%', left: '80%', score: '3.9' },
] as const;

export function Home() {
  const navigation = useNavigation<homeScreenProp>();
  const { colors, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const mapBg = isDark ? '#121514' : '#E7E8E4';
  const roadColor = isDark ? '#1D2120' : '#FFFFFF';
  const blockColor = isDark ? '#171A19' : '#DCDED9';
  const parkColor = isDark ? 'rgba(52,199,122,0.10)' : 'rgba(22,163,74,0.12)';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Hero: illustrated neighbourhood map ── */}
      <View style={{ flex: 1, backgroundColor: mapBg, overflow: 'hidden' }}>
        {BLOCKS.map((b, i) => (
          <View
            key={`b${i}`}
            style={{ position: 'absolute', ...b, backgroundColor: i === 4 ? parkColor : blockColor, borderRadius: 8 }}
          />
        ))}
        {ROADS_H.map((top, i) => (
          <View key={`h${i}`} style={{ position: 'absolute', top, left: 0, right: 0, height: 10, backgroundColor: roadColor }} />
        ))}
        {ROADS_V.map((left, i) => (
          <View key={`v${i}`} style={{ position: 'absolute', left, top: 0, bottom: 0, width: 10, backgroundColor: roadColor }} />
        ))}

        {/* Rating pins — same shape as the real map markers */}
        {PINS.map((p, i) => {
          // Neutral pins with one featured (accent) pin — mirrors the real map.
          const featured = i === 0;
          const bg = featured ? colors.accent : colors.surface1;
          return (
            <View key={`p${i}`} style={{ position: 'absolute', top: p.top, left: p.left, alignItems: 'center' }}>
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: bg,
                    borderColor: featured ? colors.accent : colors.borderMed,
                    paddingHorizontal: p.score ? 9 : 0,
                    width: p.score ? undefined : 32,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={p.score ? 'toilet' : 'plus'}
                  size={14}
                  color={featured ? colors.onAccent : colors.text2}
                />
                {p.score ? <Text style={[styles.pinText, { color: featured ? colors.onAccent : colors.text1 }]}>{p.score}</Text> : null}
              </View>
              <View style={[styles.pinTail, { borderTopColor: bg }]} />
            </View>
          );
        })}

        {/* You-are-here dot with halo */}
        <View style={{ position: 'absolute', top: '46%', left: '34%', width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, borderWidth: 3, borderColor: '#fff', ...shadows.md, shadowColor: colors.shadow }} />
        </View>

        {/* Floating preview card — telegraphs what the app does */}
        <View
          style={[
            styles.previewCard,
            { top: '58%', backgroundColor: colors.surface1, borderColor: colors.cardBorder, shadowColor: colors.shadow },
          ]}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="toilet" size={22} color={colors.text1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: colors.text1 }} numberOfLines={1}>
              Corner Café
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Text style={{ color: colors.yellow, fontSize: 11 }}>★★★★★</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: colors.text1 }}>4.8</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.text2 }}>· 2 min walk</Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.greenDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: colors.green }}>Open</Text>
          </View>
        </View>

        {/* Top scrim + logo */}
        <Fade color={colors.bg} from={0.9} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 90 }} />
        <View style={{ position: 'absolute', top: insets.top + 14, left: 24, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.logo, { backgroundColor: colors.accent, shadowColor: colors.shadow }]}>
            <MaterialCommunityIcons name="toilet" size={19} color={colors.onAccent} />
          </View>
          <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: colors.text1, letterSpacing: -0.8 }}>
            toodaloo
          </Text>
        </View>

        {/* Bottom fade into the copy block */}
        <Fade color={colors.bg} direction="up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }} />
      </View>

      {/* ── Copy + actions ── */}
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 4 }}>
        <Text style={styles.headline}>
          <Text style={{ color: colors.text1 }}>{'Find a clean bathroom, '}</Text>
          <Text style={{ color: colors.accentText }}>right now.</Text>
        </Text>
        <Text style={[styles.sub, { color: colors.text2 }]}>
          Crowd-sourced reviews and real-time locations. Never be caught out again.
        </Text>

        <View style={{ gap: 10, marginTop: 24 }}>
          <PrimaryButton
            title="Get started →"
            onPress={() => navigation.navigate('Auth', { screen: 'SignUp' })}
          />
          <SecondaryButton
            title="Log in"
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          />
        </View>

        <Text style={[styles.legal, { color: colors.text3 }]}>
          {'By continuing you agree to our '}
          <Text style={{ color: colors.accentText, fontFamily: 'PlusJakartaSans_600SemiBold' }} onPress={openLegal}>
            Terms & Privacy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  pinText: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  previewCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    ...shadows.md,
    shadowOpacity: 0.18,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headline: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    lineHeight: 38,
    letterSpacing: -1.4,
  },
  sub: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 320,
  },
  legal: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});

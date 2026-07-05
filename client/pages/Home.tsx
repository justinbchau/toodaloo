import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

type homeScreenProp = StackNavigationProp<RootStackParamList, 'ToodaLoo'>;

export function Home() {
  const navigation = useNavigation<homeScreenProp>();
  const { colors, isDark } = useThemeContext();

  const mapBg = isDark ? '#0D0D17' : '#EAE4F8';
  const roadColor = isDark ? '#161622' : '#F6F4FF';
  const blockColor = isDark ? '#111120' : '#D8D0F0';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: 52,
        paddingHorizontal: 22,
        paddingBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Purple glow — behind everything */}
      <View
        style={{
          position: 'absolute',
          top: -90,
          left: '50%',
          marginLeft: -140,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: colors.purpleGlow,
          opacity: 0.6,
        }}
        pointerEvents="none"
      />

      {/* Logo row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 30 }}>
        <View
          style={{
            width: 34,
            height: 34,
            backgroundColor: colors.purple,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.purpleGlow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <MaterialCommunityIcons name="toilet" size={18} color="#fff" />
        </View>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_800ExtraBold',
            fontSize: 18,
            color: colors.text1,
            letterSpacing: -0.7,
          }}
        >
          toodaloo
        </Text>
      </View>

      {/* Headline */}
      <Text
        style={{
          fontSize: 36,
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          lineHeight: 38,
          letterSpacing: -1.5,
          color: colors.text1,
          marginBottom: 12,
        }}
      >
        {'Find a clean\nbathroom,\n'}
        <Text style={{ color: colors.purpleText }}>right now.</Text>
      </Text>

      {/* Sub text */}
      <Text
        style={{
          fontSize: 12,
          fontFamily: 'PlusJakartaSans_400Regular',
          color: colors.text2,
          lineHeight: 19,
          maxWidth: 220,
        }}
      >
        Crowd-sourced reviews and real-time locations. Never be caught out again.
      </Text>

      {/* Custom drawn map */}
      <View
        style={{
          flex: 1,
          marginTop: 20,
          marginHorizontal: -22,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 80,
        }}
      >
        {/* Map background */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: mapBg,
          }}
        />

        {/* Horizontal roads */}
        <View
          style={{
            position: 'absolute',
            top: '38%',
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: roadColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '66%',
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: roadColor,
          }}
        />

        {/* Vertical roads */}
        <View
          style={{
            position: 'absolute',
            left: '32%',
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: roadColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '62%',
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: roadColor,
          }}
        />

        {/* City blocks */}
        <View
          style={{
            position: 'absolute',
            top: '9%',
            left: '34%',
            width: '26%',
            height: '26%',
            backgroundColor: blockColor,
            borderRadius: 5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '9%',
            left: '64%',
            width: '28%',
            height: '26%',
            backgroundColor: blockColor,
            borderRadius: 5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '43%',
            left: '0%',
            width: '30%',
            height: '21%',
            backgroundColor: blockColor,
            borderRadius: 5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '43%',
            left: '34%',
            width: '26%',
            height: '21%',
            backgroundColor: blockColor,
            borderRadius: 5,
          }}
        />

        {/* Map pin 1 — rated bathroom */}
        <View
          style={{
            position: 'absolute',
            top: '37%',
            left: '50%',
            transform: [{ translateX: -28 }, { translateY: -28 }],
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.purple,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 9, color: '#F5C542' }}>★</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>4.8</Text>
          </View>
          {/* Stem */}
          <View style={{ width: 2, height: 5, backgroundColor: colors.purple }} />
        </View>

        {/* Map pin 2 — unrated */}
        <View
          style={{
            position: 'absolute',
            top: '64%',
            left: '78%',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface3,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text2 }}>+</Text>
          </View>
          <View style={{ width: 2, height: 5, backgroundColor: colors.surface3 }} />
        </View>

        {/* User dot */}
        <View
          style={{
            position: 'absolute',
            top: '55%',
            left: '52%',
            transform: [{ translateX: -10 }, { translateY: -10 }],
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.purpleDim,
            borderWidth: 1.5,
            borderColor: colors.purple,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>

        {/* Fade top — layer 1 */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            backgroundColor: colors.bg,
            opacity: 0.9,
          }}
          pointerEvents="none"
        />
        {/* Fade top — layer 2 */}
        <View
          style={{
            position: 'absolute',
            top: 20,
            left: 0,
            right: 0,
            height: 20,
            backgroundColor: colors.bg,
            opacity: 0.4,
          }}
          pointerEvents="none"
        />

        {/* Fade bottom — layer 1 */}
        <View
          style={{
            position: 'absolute',
            bottom: 35,
            left: 0,
            right: 0,
            height: 35,
            backgroundColor: colors.bg,
            opacity: 0.4,
          }}
          pointerEvents="none"
        />
        {/* Fade bottom — layer 2 */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 35,
            backgroundColor: colors.bg,
            opacity: 0.9,
          }}
          pointerEvents="none"
        />
      </View>

      {/* Landing actions */}
      <View style={{ paddingTop: 18, flexDirection: 'column', gap: 9, zIndex: 6 }}>
        <PrimaryButton
          title="Get started →"
          onPress={() => navigation.navigate('Auth', { screen: 'SignUp' })}
        />
        <SecondaryButton
          title="Log in"
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        />
      </View>

      {/* Footer */}
      <Text
        style={{
          textAlign: 'center',
          marginTop: 8,
          fontSize: 10,
          color: colors.text3,
          letterSpacing: 0.4,
        }}
      >
        {'By continuing you agree to our '}
        <Text style={{ color: colors.purpleText }}>Terms & Privacy</Text>
      </Text>
    </SafeAreaView>
  );
}

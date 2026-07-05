import './global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ContextStore } from './context/context';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { RootStackParamList } from './RootStackParams';
import { Home } from './pages/Home';
import { Auth } from './navigation/auth';
import { MainTabs } from './navigation/tabs';
import { Success } from './pages/Success';
import { BathroomDetail } from './pages/BathroomDetail';
import { WriteReview } from './pages/WriteReview';
import { Legal } from './pages/Legal';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { session, loading } = useUser();
  const { colors } = useThemeContext();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Success" component={Success} />
          <Stack.Screen name="BathroomDetail" component={BathroomDetail} />
          <Stack.Screen name="WriteReview" component={WriteReview} />
        </>
      ) : (
        <>
          <Stack.Screen name="ToodaLoo" component={Home} />
          <Stack.Screen name="Auth" component={Auth} />
          <Stack.Screen name="Legal" component={Legal} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <ContextStore>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ContextStore>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from 'react-native-magnus';
import AppLoading from 'expo-app-loading';
import { RootStackParamList } from './RootStackParams';

import {
  useFonts,
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins';


import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';


const theme = {
  fontSize: {
    xs: 10,
    "7xl": 48,
  },
  colors: {
    purp_primary: "#6C63FF",
    white: "#fff",
    light_grey: "#B8B8B8",
    dark_grey: "#6c6c6c"
  },
  components: {
    Text: {
      fontFamily: "Poppins_600SemiBold"
    },
    Button: {
      fontFamily: "Poppins_600SemiBold"
    }
  }
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  let [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black,
    Poppins_900Black_Italic,
  });

  if (!fontsLoaded) {
    return <AppLoading />
  } else {
    return (
      <ThemeProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{
            headerShown: false
          }}>
            <Stack.Screen name='ToodaLoo' component={Home} />
            <Stack.Screen name='Login' component={Login} />
            <Stack.Screen name='SignUp' component={SignUp} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    );
  }
}

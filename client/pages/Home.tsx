import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { Button, Text, Div } from 'react-native-magnus';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';


// import LandingPageButton from '../components/LandingPageButton';

import Bathroom from '../assets/undraw_wash_hands_nwl2.svg';

type homeScreenProp = StackNavigationProp<RootStackParamList, 'ToodaLoo'>;


export default function App() {
  const navigation = useNavigation<homeScreenProp>();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Div>
        <Text textAlign="center" mt={35} mb={53} fontSize="7xl" fontWeight="bold">TooDaLoo</Text>
      </Div>
      <Div flex={1} mt={50} row justifyContent="center" alignItems="center">
        <Bathroom />
      </Div>
      <Div flex={1} justifyContent="center">
        {/* Find a way to use this component and programatically send a user
        to a different page
        */}
        {/* <LandingPageButton title="Sign Up" onPress={() => navigation.navigate("SignUp")} /> */}
        <Button
          block={true}
          mt={84}
          mx={39}
          px='xl'
          py='lg'
          bg='purp_primary'
          color='white'
          shadow="3xl"
          borderless
          fontSize="2xl"
          underlayColor='purp+primary'
          onPress={() => navigation.navigate("SignUp")}
        >
          Sign Up
        </Button>
        <Button
          block={true}
          mt={16}
          mx={39}
          px='xl'
          py='lg'
          bg='transparent'
          color='purp_primary'
          shadow="3xl"
          borderColor="purp_primary"
          borderWidth={2}
          mb={20}
          fontSize="2xl"
          onPress={() => navigation.navigate("Login")}
        >
          Log In
        </Button>
        <Text textAlign="center" color="purp_primary" textDecorLine="underline">
          Continue as guest
        </Text>
      </Div>
      {/* Need to make this a button */}
      <Text textAlign="center" color="light_grey" mt={30}>
        Terms & Services
      </Text>
      <StatusBar style='auto' />
    </SafeAreaView >
  );
}

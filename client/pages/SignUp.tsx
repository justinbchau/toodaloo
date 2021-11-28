import React from 'react';
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import BackButton from '../components/BackButton';
import SocialButtons from '../components/SocialButtons';

type signUpScreenProp = StackNavigationProp<RootStackParamList, 'SignUp'>;


export default function SignUp() {
    const navigation = useNavigation<signUpScreenProp>();

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <BackButton />
            <Div flex={1}>
                <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                    Get Started
                </Text>
                <Text mx="xl" fontSize="md" color="light_grey" mt="md" w="65%">
                    Enter your mobile number to sign up
                </Text>
                <Text color="dark_grey" mx="xl" mt="2xl">
                    Phone number
                </Text>
                <Input
                    mx="xl"
                    mt={4}
                    px="md"
                    py="lg"
                    borderColor="gray400"
                    borderWidth={2}
                    keyboardType="phone-pad"
                />
                <Button
                    block={true}
                    mt={32}
                    mx="xl"
                    px='xl'
                    py='lg'
                    bg='purp_primary'
                    color='white'
                    shadow="3xl"
                    borderless
                    fontSize="2xl"
                    underlayColor='purp+primary'
                    onPress={() => navigation.navigate("ToodaLoo")}
                >
                    Send OTP
                </Button>

                <Div
                    mx="xl"
                    alignItems="center"
                    justifyContent="center"
                    flexDir="row"
                    mt="2xl">
                    <Div h={1} flex={1} bg="gray200" />
                    <Text px="lg" fontSize="sm" color="gray500">
                        Or sign up with
                    </Text>
                    <Div h={1} flex={1} bg="gray200" />
                </Div>
                <SocialButtons />
            </Div>

        </SafeAreaView>
    )
}
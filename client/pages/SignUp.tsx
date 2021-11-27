import React from 'react';
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'

import BackButton from '../components/BackButton';


export default function SignUp() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <BackButton />
            <Div flex={1}>
                <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                    Get Started
                </Text>
                <Text mx="xl" fontSize="lg" color="gray600" mt="md" w="60%">
                    Enter your mobile number to sign in
                </Text>
                <Text color="gray600" mx="xl" mt="2xl">
                    Phone number
                </Text>
                <Input
                    mx="xl"
                    mt="md"
                    px="md"
                    py="sm"
                    borderColor="gray200"
                    borderWidth={1}
                    prefix={
                        <Div row alignItems="center">
                            <Button
                                bg="white"
                                alignItems="center"
                                suffix={
                                    <Icon
                                        name="chevron-down"
                                        fontFamily="Feather"
                                        color="gray900"
                                        h={20}
                                        ml="sm"
                                    />
                                }
                                color="black">
                                <Text fontWeight="bold">+1</Text>
                            </Button>
                            <Div bg="gray200" w={1} h={25} ml="sm" />
                        </Div>
                    }
                    keyboardType="phone-pad"
                />
                <Button
                    mx="xl"
                    mt="xl"
                    mb="xl"
                    py="lg"
                    bg="purple600"
                    rounded="circle"
                    block
                    onPress={() => navigation.navigate('App', {})}>
                    Send OTP
                </Button>

                <Div
                    mx="xl"
                    alignItems="center"
                    justifyContent="center"
                    flexDir="row"
                    mt="xl">
                    <Div h={1} flex={1} bg="gray200" />
                    <Text px="lg" fontSize="sm" color="gray500">
                        Or continue with
                    </Text>
                    <Div h={1} flex={1} bg="gray200" />
                </Div>

                <Div
                    mx="xl"
                    alignItems="center"
                    justifyContent="center"
                    flexDir="row"
                    mt="xl">
                    <Button
                        mr="md"
                        flex={1}
                        h={50}
                        w={50}
                        py="lg"
                        rounded="circle"
                        borderWidth={1}
                        borderColor="gray200"
                        bg="white"

                    >
                        <Icon
                            name="apple1"
                            fontSize="2xl"
                            color="gray600"
                            fontFamily="AntDesign"
                        />
                    </Button>
                    <Button
                        ml="md"
                        flex={1}
                        py="lg"
                        h={50}
                        w={50}
                        rounded="circle"
                        borderWidth={1}
                        borderColor="gray200"
                        bg="white">
                        <Icon
                            name="google"
                            fontSize="2xl"
                            color="green700"
                            fontFamily="AntDesign"
                        />
                    </Button>
                </Div>
            </Div>
            {/* <Image
                source={require('./assets/login.png')}
                alignSelf="flex-end"
                h={undefined}
                style={{ aspectRatio: 3.82978723404 }}
                w="100%"
            /> */}

        </SafeAreaView>
    )
}
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Formik } from "formik";

import { Labels } from '../constants/labels';

import { SocialButtons } from '../components/SocialButtons'
import { Page } from '../templates/Page';

type loginScreenProp = StackNavigationProp<RootStackParamList, 'Login'>;


export function Login() {
    const navigation = useNavigation<loginScreenProp>();
    return (
        <Page>
            <Div flex={1}>
                <Formik
                    initialValues={{
                        username: '',
                        password: ''
                    }}
                    onSubmit={() => { }}
                >
                    <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                        {Labels.login}
                    </Text>
                    <Text mx="xl" fontSize="md" color="light_grey" mt="md" w="60%">
                        Enter your credentials to log in
                    </Text>
                    <Text color="dark_grey" mx="xl" mt="2xl">
                        Username
                    </Text>
                    <Input
                        mx="xl"
                        mt={4}
                        px="md"
                        py="lg"
                        borderColor="gray400"
                        borderWidth={2}
                        focusBorderColor="blue700"
                    />
                    <Text color="dark_grey" mx="xl" mt="lg">
                        Password
                    </Text>
                    <Input
                        mx="xl"
                        mt={4}
                        px="md"
                        py="lg"
                        borderColor="gray400"
                        borderWidth={2}
                        secureTextEntry
                        focusBorderColor="blue700"
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
                        onPress={() => navigation.navigate("Map")}
                    >
                        {Labels.login}
                    </Button>

                    <Div
                        mx="xl"
                        alignItems="center"
                        justifyContent="center"
                        flexDir="row"
                        mt="xl">
                        <Div h={1} flex={1} bg="gray200" />
                        <Text px="lg" fontSize="sm" color="light_grey">
                            Or continue with
                        </Text>
                        <Div h={1} flex={1} bg="gray200" />
                    </Div>
                    <SocialButtons />
                </Formik>
            </Div>

        </Page>
    )
}
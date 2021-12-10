import React from 'react'
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { Page } from '../templates/Page';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type passwordScreenProp = StackNavigationProp<RootStackParamList, 'Password'>;

export function Password() {
    const navigation = useNavigation<passwordScreenProp>();

    return (
        <Page>
            <Div flex={1}>
                <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                    Password
                </Text>
                <Text mx="xl" fontSize="md" color="light_grey" mt="md" w="70%">
                    Enter a unique and secure password for your account
                </Text>
                <Text color="dark_grey" mx="xl" mt="2xl">
                    Password
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
                    Next
                </Button>
            </Div>
        </Page>
    )
}
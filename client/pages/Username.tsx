import React from 'react'
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { Page } from '../templates/Page';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type usernameScreenProp = StackNavigationProp<RootStackParamList, 'Username'>;

export function Username() {
    const navigation = useNavigation<usernameScreenProp>();

    return (
        <Page>
            <Div flex={1}>
                <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                    Username
                </Text>
                <Text mx="xl" fontSize="md" color="light_grey" mt="md" w="60%">
                    Enter a username to represent you
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
                    onPress={() => navigation.navigate("Password")}
                >
                    Next
                </Button>
            </Div>
        </Page>
    )
}
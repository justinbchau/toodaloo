import React from 'react'
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { Page } from '../templates/Page';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type confirmScreenProp = StackNavigationProp<RootStackParamList, 'Confirmation'>;

export function Confirmation() {
    const navigation = useNavigation<confirmScreenProp>();

    return (
        <Page>
            <Div flex={1}>
                <Text mt="2xl" mx="xl" w="70%" fontWeight="bold" fontSize="5xl">
                    Code
                </Text>
                <Text mx="xl" fontSize="md" color="light_grey" mt="md" w="60%">
                    Enter the code sent to your number
                </Text>
                <Text color="dark_grey" mx="xl" mt="2xl">
                    Confirmation Code
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
                    onPress={() => navigation.navigate("Username")}
                >
                    Next
                </Button>

                <Div
                    mx="xl"
                    alignItems="center"
                    justifyContent="center"
                    flexDir="row"
                    mt="xl">
                    <Div h={1} flex={1} bg="gray200" />
                    <Text px="lg" fontSize="sm" color="purp_primary">
                        Send SMS message again
                    </Text>
                    <Div h={1} flex={1} bg="gray200" />
                </Div>
            </Div>
        </Page>
    )
}
import React from 'react'
import { Div, Button, Text, Icon } from 'react-native-magnus'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import Google from '../assets/icons8-google.svg'

type loginScreenProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function SocialButtons() {
    const navigation = useNavigation<loginScreenProp>();

    return (
        <Div
            flex={1}
        >
            <Button
                block={true}
                mt={32}
                mx="xl"
                px='xl'
                py='lg'
                bg='black'
                color='white'
                shadow="3xl"
                borderless
                fontSize="2xl"
                underlayColor='purp+primary'
                onPress={() => navigation.navigate("SignUp")}
            >
                <Icon
                    name="apple1"
                    fontSize="3xl"
                    color="white"
                    fontFamily="AntDesign"
                />
            </Button>
            <Button
                block={true}
                mt={16}
                mx="xl"
                px='xl'
                py='lg'
                bg='transparent'
                shadow="3xl"
                borderColor="black"
                borderWidth={2}
                onPress={() => navigation.navigate("SignUp")}
            >
                <Google />
            </Button>
        </Div>
    )
}


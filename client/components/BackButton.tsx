import React from 'react'
import { Pressable } from 'react-native';
import { Div, Button, Icon } from 'react-native-magnus'
import { useNavigation } from '@react-navigation/native';

export default function BackButton() {
    const navigation = useNavigation();

    return (
        <Div row ml={17} mt={20}>
            <Pressable
                onPress={() => navigation.goBack()}
            >
                <Icon name="chevron-back" color="black" fontSize={30} fontFamily="Ionicons" />
            </Pressable>
        </Div >
    )
}

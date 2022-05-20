import React from 'react'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Page } from '../templates/Page'
import { Text } from 'react-native-magnus'

type profileScreenProp = StackNavigationProp<RootStackParamList, 'Map'>;

export function Profile() {
    const navigation = useNavigation<profileScreenProp>()

    return (
        <Page>
            <Text>Profile</Text>
        </Page>

    )
}
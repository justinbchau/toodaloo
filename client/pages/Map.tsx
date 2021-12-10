import React from 'react'
import { SafeAreaView } from 'react-native';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import { Page } from '../templates/Page';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

// type usernameScreenProp = StackNavigationProp<RootStackParamList, 'Username'>;

export function Map() {
    // const navigation = useNavigation<usernameScreenProp>();

    return (
        <Page>
            <Div flex={1}>
                <Text>
                    Map Page
                </Text>
            </Div>
        </Page>
    )
}
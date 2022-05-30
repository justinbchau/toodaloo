import React from 'react'

import { Div, Text } from 'react-native-magnus'
import { Page } from '../templates/Page'

export function Billing() {
    return (
        <Page>
            <Div flex={1} alignItems="center">
                <Div>
                    <Text fontSize="4xl">Billing</Text>
                </Div>
                <Div mt="2xl">
                    <Text fontSize="lg">Give me your MONEY 🤑</Text>
                </Div>
            </Div>
        </Page>
    )
}
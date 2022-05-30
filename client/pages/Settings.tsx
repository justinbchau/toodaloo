import React, { useState } from 'react'
import { Page } from '../templates/Page'
import { Div, Text, Toggle } from 'react-native-magnus'

export function Settings() {
    const [on, toggle] = useState(false);

    return (
        <Page>
            <Div flex={1} alignItems="center">
                <Div>
                    <Text fontSize="4xl">Settings</Text>
                </Div>

                <Div justifyContent="space-between" w="90%" alignItems="center" mt="2xl" row>
                    <Div>
                        <Text fontSize="lg">Dark mode toggle</Text>
                    </Div>
                    <Toggle
                        ml="auto"
                        mr={18}
                        on={on}
                        onPress={() => toggle(!on)}
                        bg="gray400"
                        circleBg="purp_primary"
                        activeBg="purp_primary"
                        h={30}
                        w={60}
                    />
                </Div>
            </Div>

        </Page>
    )
}
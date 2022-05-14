import React from 'react'
import { Div, Text, Avatar, Button } from 'react-native-magnus'

export function DrawerContents() {
    return (
        <Div>
            {/* Avatar container */}
            <Div
                ml="10%"
                mt="10%"
                left="60%"
            >
                <Avatar
                    shadow={1}
                    bg="red300"
                    size={55}
                    color="red800">
                    J
                </Avatar>
            </Div>
            {/* Account name container */}
            <Div
                mt="5%"
                left="55%"
            >
                <Text
                    fontSize="xl"
                >
                    Justin Chau
                </Text>
                <Text
                    color='gray500'
                >
                    @chau_codes
                </Text>
            </Div>

            <Div
                mt="30%"
                left="65%"
            >
                <Text
                    fontSize="2xl"
                    textAlign='left'
                >
                    Profile
                </Text>
                <Text
                    mt="10%"

                    fontSize="2xl"
                >
                    Favorites
                </Text>
                <Text
                    mt="10%"
                    fontSize="2xl"
                >
                    Profile
                </Text>
                <Text
                    mt="10%"
                    fontSize="2xl"
                >
                    Profile
                </Text>
            </Div>

        </Div>
    )
}
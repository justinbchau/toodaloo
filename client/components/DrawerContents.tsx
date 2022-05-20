import React from 'react'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native'
import { Pressable } from 'react-native'
import { Div, Text, Avatar } from 'react-native-magnus'

type profileScreenProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export function DrawerContents() {
    const navigation = useNavigation<profileScreenProp>()

    return (
        <Div>
            {/* Avatar container */}
            <Div
                ml="10%"
                mt="10%"
                left={200}
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
                left={180}
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

            {/* Buttons Container */}
            <Div
                mt="20%"
                left={180}
            >

                <Pressable
                    onPress={() => navigation.navigate("Profile")}
                >
                    <Text
                        fontSize="2xl"
                        textAlign='left'
                    >
                        Profile
                    </Text>
                </Pressable>

                <Pressable>
                    <Text
                        mt="10%"

                        fontSize="2xl"
                    >
                        Favorites
                    </Text>
                </Pressable>

                <Pressable>
                    <Text
                        mt="10%"
                        fontSize="2xl"
                    >
                        Profile
                    </Text>
                </Pressable>

                <Pressable>
                    <Text
                        mt="10%"
                        fontSize="2xl"
                    >
                        Profile
                    </Text>
                </Pressable>

            </Div>

        </Div>
    )
}
import React from 'react'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Page } from '../templates/Page'
import { Text, Div, Avatar, Icon, Button } from 'react-native-magnus'
import { Pressable } from 'react-native';

type profileScreenProp = StackNavigationProp<RootStackParamList, 'Map'>;

export function Profile() {
    const navigation = useNavigation<profileScreenProp>()

    return (
        <Page>
            <Div flex={1} alignItems="center">

                <Div>
                    <Text fontSize="4xl">Profile</Text>
                </Div>

                <Div
                    mt="10%"
                >
                    <Avatar
                        shadow={3}
                        bg="purp_primary"
                        size={115}
                    >
                        <Icon name="toilet" color="white" fontFamily="FontAwesome5" fontSize="7xl" />
                    </Avatar>
                </Div>

                <Div mt="5%">
                    <Text fontSize="3xl" textAlign='center'>
                        Justin Chau
                    </Text>
                    <Text fontSize="md" textAlign='center' color='gray500'>
                        @chau_codes
                    </Text>
                </Div>

                {/* Divider Line */}
                <Div alignItems="center" justifyContent="center" row mt="xl" w="80%">
                    <Div h={1} flex={1} bg="gray400"></Div>
                </Div>

                <Div
                    row
                    mt="xl"
                    justifyContent="space-between"
                    w="80%"
                    alignItems="center"
                >
                    <Div alignItems="center">
                        <Text fontSize="xl" fontWeight="400">58</Text>
                        <Text fontSize="xl" color='gray600'>Saved</Text>
                    </Div>
                    <Div alignItems="center">
                        <Text fontSize="xl" fontWeight="400">58</Text>
                        <Text fontSize="xl" color='gray600'>Saved</Text>
                    </Div>
                    <Div alignItems="center">
                        <Text fontSize="xl" fontWeight="400">58</Text>
                        <Text fontSize="xl" color='gray600'>Saved</Text>
                    </Div>
                </Div>

                {/* White Button Box Container */}
                <Div
                    mt="2xl"
                    bg='white'
                    w="95%"
                    h="60%"
                    shadow="lg"
                    roundedTop="2xl"
                >
                    <Div
                        mt="2xl"
                        ml="xl"
                        h="60%"
                        justifyContent="space-between"
                    >
                        {/* Make these buttons reusable for cleaner code */}
                        <Pressable
                            onPress={() => console.log("Profile button pressed")}
                        >
                            <Div row alignItems="center">
                                <Button bg='gray200' rounded="2xl">
                                    <Icon name="settings" fontSize="6xl" fontFamily="Ionicons" color="black" />
                                </Button>
                                <Text ml="7%" fontSize="2xl" >Settings</Text>
                                <Icon ml="auto" mr={18} name="chevron-right" fontFamily="Entypo" color="black" fontSize="5xl" />
                            </Div>
                        </Pressable>
                        <Div row alignItems="center">
                            <Button bg='gray200' rounded="2xl">
                                <Icon name="credit-card" fontSize="6xl" fontFamily="MaterialCommunityIcons" color="black" />
                            </Button>
                            <Text ml="7%" fontSize="2xl" >Billing Details</Text>
                            <Icon ml="auto" mr={18} name="chevron-right" fontFamily="Entypo" color="black" fontSize="5xl" />
                        </Div>

                        <Div alignItems="center" justifyContent="center" row mt="xl" w="90%">
                            <Div h={1} flex={1} bg="gray400"></Div>
                        </Div>

                        <Div row alignItems="center">
                            <Button bg='gray200' rounded="2xl">
                                <Icon name="logout" fontSize="6xl" fontFamily="MaterialIcons" color="black" />
                            </Button>
                            <Text ml="7%" fontSize="2xl" >Logout</Text>
                            <Icon ml="auto" mr={18} name="chevron-right" fontFamily="Entypo" color="black" fontSize="5xl" />
                        </Div>
                    </Div>

                </Div>


            </Div>
        </Page>

    )
}
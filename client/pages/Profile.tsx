import React from 'react'
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Page } from '../templates/Page'
import { Text, Div, Avatar, Icon } from 'react-native-magnus'
import { StatBlock } from '../components/StatBlock';
import { ProfileButton } from '../components/ProfileButton';
import { Divider } from '../components/Divider';

type profileScreenProp = StackNavigationProp<RootStackParamList, 'Profile'>;

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

                {/* Divider */}
                <Divider marginTop='xl' width='80%' />
                {/* End of Divider */}

                <Div
                    row
                    mt="xl"
                    justifyContent="space-between"
                    w="80%"
                    alignItems="center"
                >
                    <StatBlock stat="58" label="Saved" />
                    <StatBlock stat="69" label="Poops" />
                    <StatBlock stat="69" label="Flushes" />
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
                        <ProfileButton
                            buttonName='Settings'
                            iconFontFamily='Ionicons'
                            iconName='settings'
                            onPress={() => navigation.navigate("Settings")}
                        />
                        <ProfileButton
                            buttonName='Billing Details'
                            iconFontFamily='MaterialCommunityIcons'
                            iconName='credit-card'
                            onPress={() => navigation.navigate("Billing")}
                        />

                        {/* Divider */}
                        <Divider marginTop='md' width='90%' />
                        {/* End of Divider */}

                        <ProfileButton
                            buttonName='Logout'
                            iconFontFamily='MaterialIcons'
                            iconName='logout'
                            onPress={() => console.log("Logout pressed")}
                        />
                    </Div>

                </Div>


            </Div>
        </Page>

    )
}
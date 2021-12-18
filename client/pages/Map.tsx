import React, { useEffect, useState } from 'react'
import { StyleSheet, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import { Div, Input, Text, Button, Icon } from 'react-native-magnus'
import * as Location from 'expo-location';
import { RootStackParamList } from '../RootStackParams';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { LocationObject } from 'expo-location';
import { zIndexProps } from 'react-native-magnus/lib/typescript/src/types';

type mapScreenProp = StackNavigationProp<RootStackParamList, 'Map'>;

export function Map() {
    const [location, setLocation] = useState<null | LocationObject>(null);
    const [errorMsg, setErrorMsg] = useState<null | string>(null);
    const navigation = useNavigation<mapScreenProp>();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            console.log(location)
            setLocation(location);
        })();
    }, []);

    let text = 'Waiting..';
    if (errorMsg) {
        text = errorMsg;
    } else if (location) {
        text = JSON.stringify(location);
    }

    return (
        <Div>
            <Div row mt="25%" mb="20%" justifyContent="space-around" position="relative" style={{ zIndex: 1000 }}>
                <Input
                    flex={6}
                    placeholder="Search location"
                    ml="7%"
                    px="md"
                    py="lg"
                    borderWidth={0}
                    shadow="lg"
                    shadowColor="black"
                    focusBorderColor="blue700"
                    prefix={<Icon name="search" color="black" fontFamily="Feather" fontSize="3xl" />} />

                <Button
                    bg="white"
                    h={50}
                    w={50}
                    ml="5%"
                    mr="10%"
                    rounded="circle"
                    shadow="lg"
                    borderless
                >
                    <Icon name="menu" color="black" fontFamily="SimpleLineIcons" fontSize="3xl" />
                </Button>
            </Div>
            <Div row position="absolute" bottom={-520} right={50} style={{ zIndex: 1000 }} >

                <Button
                    px='xl'
                    py='lg'
                    bg='purp_primary'
                    color='white'
                    shadow="3xl"
                    borderless
                    fontSize="2xl"
                    underlayColor='purp+primary'
                    onPress={() => navigation.navigate("ToodaLoo")}
                >
                    Find bathrooms near me
                </Button>
            </Div>
            {location &&
                <MapView initialRegion={{
                    latitude: location?.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }} showsUserLocation={true} style={styles.map} />
            }

        </Div>
    )
}

const styles = StyleSheet.create({
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        position: "absolute"
    }
})
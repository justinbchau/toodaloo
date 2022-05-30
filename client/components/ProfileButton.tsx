import React from 'react'
import { Pressable } from 'react-native'
import { Div, Icon, Text, Button } from 'react-native-magnus'
import { iconFontFamilyType } from 'react-native-magnus/lib/typescript/src/ui/icon/icon.type';

interface Props {
    iconName: string;
    iconFontFamily: iconFontFamilyType;
    buttonName: string;
    onPress: () => void;
}

export function ProfileButton(props: Props) {
    return (
        <Pressable
            onPress={props.onPress}
        >
            <Div row alignItems="center">
                <Div justifyContent="center" h={55} w={55} bg="gray200" rounded="2xl">
                    <Icon name={props.iconName} fontSize="6xl" fontFamily={props.iconFontFamily} color="black" />
                </Div>
                <Text ml="7%" fontSize="2xl" >{props.buttonName}</Text>
                <Icon ml="auto" mr={18} name="chevron-right" fontFamily="Entypo" color="black" fontSize="5xl" />
            </Div>
        </Pressable>
    )
}
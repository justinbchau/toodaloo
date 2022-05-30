import React from 'react'
import { Div, Text } from 'react-native-magnus';

interface Props {
    stat: string;
    label: string;
}

export function StatBlock(props: Props) {
    return (
        <Div alignItems="center">
            <Text fontSize="xl" fontWeight="400">{props.stat}</Text>
            <Text fontSize="xl" color='gray600'>{props.label}</Text>
        </Div>
    )
}
import React from 'react'
import { Div } from 'react-native-magnus'

interface Props {
    marginTop: string;
    width: string;
}

export function Divider(props: Props) {
    return (
        <Div alignItems="center" justifyContent="center" row mt={props.marginTop} w={props.width}>
            <Div h={1} flex={1} bg="gray400"></Div>
        </Div>
    )
}
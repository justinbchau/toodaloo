import React from 'react'
import { Tag } from 'react-native-magnus'

interface FilterButtonProps {
    title: string;
    onPress?: () => void
}


export function FilterButton(props: FilterButtonProps) {

    return (
        <>
            <Tag onPress={props.onPress} rounded="circle" bg="white" borderWidth={1} borderColor="gray500" py="md" color="black" fontSize="xs" mr={10}>{props.title}</Tag>
        </>
    )
}
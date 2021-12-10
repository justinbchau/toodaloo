import React from 'react'
import { SafeAreaView } from 'react-native';
import BackButton from '../components/BackButton';

type Props = {
    children?: React.ReactNode
}

export function Page({ children }: Props) {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <BackButton />
            {children}
        </SafeAreaView>
    )
}
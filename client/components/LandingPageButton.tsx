import React from 'react'
import { Button } from 'react-native-magnus'

type LandingButtonProps = {
    title: string;
    onPress: any
}

export default function LandingPageButton({ title }: LandingButtonProps) {

    return (
        <Button
            block={true}
            mt={64}
            mx={39}
            px='xl'
            py='lg'
            bg='purple600'
            color='white'
            shadow="3xl"
            borderless
            underlayColor='purple500'
            mb={50}
        >
            {title}
        </Button>

    )
}
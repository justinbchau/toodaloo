import React, { useRef } from 'react'
import { Text, Button, Icon, Drawer, DrawerRef, DrawerProps } from 'react-native-magnus'

export function DrawerButton(props: DrawerProps) {

    const drawerRef = useRef<DrawerRef>(null)

    return (
        <>
            <Drawer
                ref={drawerRef}
                children={props.children}
                direction="right"
                animationTime={400}
                drawerPercentage={80}
            />
            <Button
                bg="white"
                h={50}
                w={50}
                ml="5%"
                mr="10%"
                rounded="circle"
                shadow="lg"
                borderless
                onPress={() => {
                    if (drawerRef.current) {
                        drawerRef.current.open();
                    }
                }}
            >
                <Icon name="menu" color="black" fontFamily="SimpleLineIcons" fontSize="3xl" />
            </Button>
        </>
    )
}
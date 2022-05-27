import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootStackParamList } from '../RootStackParams';
import { Profile } from '../pages/Profile';
import { Map } from '../pages/Map';

const DrawerNav = createDrawerNavigator<RootStackParamList>();

export function Drawer() {
    return (
        <DrawerNav.Navigator>
            <DrawerNav.Screen name="Profile" component={Profile} />
            <DrawerNav.Screen name="Map" component={Map} />
        </DrawerNav.Navigator>
    )
}
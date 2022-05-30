import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootStackParams';
import { Profile, Settings, Billing } from '../pages'


const DrawerNav = createNativeStackNavigator<RootStackParamList>();

export function Drawer() {
    return (
        <DrawerNav.Navigator screenOptions={{
            headerShown: false
        }} >
            <DrawerNav.Screen name="Profile" component={Profile} />
            <DrawerNav.Screen name="Billing" component={Billing} />
            <DrawerNav.Screen name="Settings" component={Settings} />
        </DrawerNav.Navigator >
    )
}
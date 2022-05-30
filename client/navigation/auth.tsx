import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../RootStackParams';
import { Login, Password, Username, SignUp, Confirmation } from '../pages';

const AuthNav = createNativeStackNavigator<RootStackParamList>();

export function Auth() {
    return (
        <AuthNav.Navigator screenOptions={{
            headerShown: false
        }} >
            <AuthNav.Screen name="Login" component={Login} />
            <AuthNav.Screen name="Password" component={Password} />
            <AuthNav.Screen name="Username" component={Username} />
            <AuthNav.Screen name="SignUp" component={SignUp} />
            <AuthNav.Screen name="Confirmation" component={Confirmation} />
        </AuthNav.Navigator>
    )
}
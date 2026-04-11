import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../RootStackParams';
import { Login, Password, Username, SignUp, Confirmation } from '../pages';

const AuthNav = createNativeStackNavigator<AuthStackParamList>();

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

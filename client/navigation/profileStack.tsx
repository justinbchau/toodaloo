import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../RootStackParams';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { MyReviews } from '../pages/MyReviews';
import { Submitted } from '../pages/Submitted';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="MyReviews" component={MyReviews} />
      <Stack.Screen name="Submitted" component={Submitted} />
    </Stack.Navigator>
  );
};

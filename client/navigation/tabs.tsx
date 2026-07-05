import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../RootStackParams';
import { Map } from '../pages/Map';
import { AddBathroom } from '../pages/AddBathroom';
import { Saved } from '../pages/Saved';
import { ProfileStack } from './profileStack';
import { useThemeContext } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();


const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colors } = useThemeContext();

  const tabs = [
    { name: 'Map', icon: 'map' },
    { name: 'Saved', icon: 'bookmark' },
    { name: 'Add', icon: 'plus' },
    { name: 'Profile', icon: 'account' },
  ] as const;

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface1,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 28,
      paddingTop: 12,
      height: 80,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabs[index];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            style={({ pressed }: { pressed: boolean }) => [{ flex: 1, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 }]}
            onPress={onPress}
          >
            <MaterialCommunityIcons
              name={tab?.icon ?? 'circle'}
              size={22}
              color={isFocused ? colors.purpleText : colors.text3}
            />
            <Text style={{
              fontSize: 10,
              color: isFocused ? colors.purpleText : colors.text3,
              fontFamily: 'PlusJakartaSans_500Medium',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {route.name}
            </Text>
            {isFocused && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.purple, marginTop: 2 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Saved" component={Saved} />
      <Tab.Screen name="Add" component={AddBathroom} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

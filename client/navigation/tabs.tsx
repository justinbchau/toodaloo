import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../RootStackParams';
import { Map } from '../pages/Map';
import { AddBathroom } from '../pages/AddBathroom';
import { Saved } from '../pages/Saved';
import { ProfileStack } from './profileStack';
import { useThemeContext } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

type Glyph = keyof typeof MaterialCommunityIcons.glyphMap;

const TABS: Record<keyof MainTabParamList, { label: string; icon: Glyph; activeIcon: Glyph }> = {
  Map: { label: 'Explore', icon: 'map-outline', activeIcon: 'map' },
  Saved: { label: 'Saved', icon: 'bookmark-outline', activeIcon: 'bookmark' },
  Add: { label: 'Add', icon: 'plus', activeIcon: 'plus' },
  Profile: { label: 'Profile', icon: 'account-circle-outline', activeIcon: 'account-circle' },
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface1,
          borderTopColor: colors.borderMed,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS[route.name as keyof MainTabParamList];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Center "Add" action: a raised brand button rather than a plain tab.
        if (route.name === 'Add') {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel="Add a bathroom"
              accessibilityState={{ selected: isFocused }}
              style={styles.item}
            >
              {({ pressed }: { pressed: boolean }) => (
                <View
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.shadow,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="plus" size={26} color={colors.onPrimary} />
                </View>
              )}
            </Pressable>
          );
        }

        const color = isFocused ? colors.accentText : colors.text3;
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab?.label ?? route.name}
            accessibilityState={{ selected: isFocused }}
            style={({ pressed }: { pressed: boolean }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialCommunityIcons name={isFocused ? tab.activeIcon : tab.icon} size={25} color={color} />
            <Text
              style={[
                styles.label,
                { color, fontFamily: isFocused ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium' },
              ]}
            >
              {tab?.label ?? route.name}
            </Text>
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

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});

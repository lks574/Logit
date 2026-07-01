import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { BottomTabBar } from './BottomTabBar';
import { RootStackParamList, TabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ActivitySelectScreen from '../screens/ActivitySelectScreen';
import AddChooserScreen from '../screens/AddChooserScreen';
import RecordFormScreen from '../screens/RecordFormScreen';
import DetailScreen from '../screens/DetailScreen';
import AddPlanScreen from '../screens/AddPlanScreen';
import AddActivityScreen from '../screens/AddActivityScreen';
import PlansScreen from '../screens/PlansScreen';
import HomeEmptyScreen from '../screens/HomeEmptyScreen';
import StatsEmptyScreen from '../screens/StatsEmptyScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Empty "Add" tab; the FAB in BottomTabBar navigates to ActivitySelect instead.
function AddPlaceholder() {
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Add" component={AddPlaceholder} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { c, scheme } = useTheme();
  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: c.bg,
      card: c.surface,
      text: c.text,
      border: c.border,
      primary: c.accent,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="AddChooser" component={AddChooserScreen} />
          <Stack.Screen name="ActivitySelect" component={ActivitySelectScreen} />
          <Stack.Screen name="RecordForm" component={RecordFormScreen} />
          <Stack.Screen name="AddPlan" component={AddPlanScreen} />
          <Stack.Screen name="AddActivity" component={AddActivityScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        </Stack.Group>
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Plans" component={PlansScreen} />
        <Stack.Screen name="HomeEmpty" component={HomeEmptyScreen} />
        <Stack.Screen name="StatsEmpty" component={StatsEmptyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

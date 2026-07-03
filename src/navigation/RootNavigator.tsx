import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { BottomTabBar } from './BottomTabBar';
import { RootStackParamList, TabParamList } from './types';

import HomeScreen from '../screens/home/HomeScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PlansScreen from '../screens/calendar/PlansScreen';
import AddPlanScreen from '../screens/calendar/AddPlanScreen';
import AddChooserScreen from '../screens/add/AddChooserScreen';
import ActivitySelectScreen from '../screens/add/ActivitySelectScreen';
import AddActivityScreen from '../screens/add/AddActivityScreen';
import RecordFormScreen from '../screens/add/RecordFormScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import DetailScreen from '../screens/shared/DetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
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
        {/* 모달 시트는 상단 세이프에어리어 inset이 0이라 헤더가 시트 top에 붙는다 → 공통 상단 여백. */}
        <Stack.Group screenOptions={{ presentation: 'modal', contentStyle: { paddingTop: 14 } }}>
          <Stack.Screen name="AddChooser" component={AddChooserScreen} />
          <Stack.Screen name="ActivitySelect" component={ActivitySelectScreen} />
          <Stack.Screen name="RecordForm" component={RecordFormScreen} />
          <Stack.Screen name="AddPlan" component={AddPlanScreen} />
          <Stack.Screen name="AddActivity" component={AddActivityScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        </Stack.Group>
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Plans" component={PlansScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

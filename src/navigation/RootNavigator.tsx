import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/StoreContext';
import { BottomTabBar } from './BottomTabBar';
import { AuthNavigator } from './AuthNavigator';
import { trackScreen } from '../lib/analytics';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { RootStackParamList, TabParamList } from './types';
import { linking } from './linking';

import HomeScreen from '../screens/home/HomeScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PlansScreen from '../screens/calendar/PlansScreen';
import AddPlanScreen from '../screens/calendar/AddPlanScreen';
import ActivitySelectScreen from '../screens/add/ActivitySelectScreen';
import AddActivityScreen from '../screens/add/AddActivityScreen';
import RecordFormScreen from '../screens/add/RecordFormScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import MyScreen from '../screens/settings/MyScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import FeedbackScreen from '../screens/settings/FeedbackScreen';
import RoadmapScreen from '../screens/settings/RoadmapScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import DetailScreen from '../screens/shared/DetailScreen';
import CategoryStatsScreen from '../screens/stats/CategoryStatsScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="My" component={MyScreen} />
    </Tab.Navigator>
  );
}

// 인증·인증완료 사용자용 앱 스택(기존 화면 전부).
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* 모달 시트는 상단 세이프에어리어 inset이 0이라 헤더가 시트 top에 붙는다 → 공통 상단 여백. */}
      <Stack.Group screenOptions={{ presentation: 'modal', contentStyle: { paddingTop: 14 } }}>
        <Stack.Screen name="ActivitySelect" component={ActivitySelectScreen} />
        <Stack.Screen name="RecordForm" component={RecordFormScreen} />
        <Stack.Screen name="AddPlan" component={AddPlanScreen} />
        <Stack.Screen name="AddActivity" component={AddActivityScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      </Stack.Group>
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="CategoryStats" component={CategoryStatsScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Roadmap" component={RoadmapScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { c, scheme } = useTheme();
  const { status, user, guest } = useAuth();
  const { ready, onboardingComplete } = useStore();
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const lastRoute = React.useRef<string | undefined>(undefined);
  // 화면 전환 추적 → 계측 플로우 데이터. 동의 전엔 trackScreen이 내부 no-op.
  const onScreenChange = () => {
    const name = navRef.getCurrentRoute()?.name;
    if (name && name !== lastRoute.current) {
      lastRoute.current = name;
      trackScreen(name);
    }
  };
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

  const splash = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <ActivityIndicator color={c.accent} />
    </View>
  );

  const content = () => {
    if (status === 'loading') return splash;
    if (!user && !guest) return <AuthNavigator />; // 로그인 안 함 + 게스트 아님 → 시작 화면
    if (user && !user.emailVerified) return <VerifyEmailScreen />; // authed + 미인증 → 인증 대기 게이트
    if (!ready) return splash; // 스토어 하이드레이션 대기(온보딩 깜빡임 방지)
    if (!onboardingComplete) return <OnboardingScreen />; // 가입 직후 1회
    return <AppStack />;
  };

  return (
    <NavigationContainer ref={navRef} theme={navTheme} linking={linking} onReady={onScreenChange} onStateChange={onScreenChange}>
      {content()}
    </NavigationContainer>
  );
}

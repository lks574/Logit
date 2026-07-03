import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StoreProvider, useStore } from './src/store/StoreContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';

// 저장 실패(저장 공간 부족 등) 시 전역 배너 — 무음 유실을 사용자에게 알린다.
function PersistErrorBanner() {
  const { c } = useTheme();
  const { persistError } = useStore();
  const insets = useSafeAreaInsets();
  if (!persistError) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: c.error,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
        저장 공간이 부족해 변경사항이 저장되지 않았습니다. 공간을 확보해 주세요.
      </Text>
    </View>
  );
}

function Root() {
  const { scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      <PersistErrorBanner />
    </>
  );
}

// 로그인 사용자 정보를 로컬 프로필에 반영(향후 동기화의 신원 소스). 이름은 사용자가 편집했을 수 있어
// displayName이 있을 때만 시드하고, 이메일은 계정 이메일을 따른다.
function AuthProfileSync() {
  const { user } = useAuth();
  const { profile, updateProfile } = useStore();
  React.useEffect(() => {
    if (!user) return;
    const patch: { name?: string; email?: string } = {};
    if (user.displayName && !profile.name) patch.name = user.displayName;
    if (user.email && user.email !== profile.email) patch.email = user.email;
    if (Object.keys(patch).length) updateProfile(patch);
  }, [user, profile.name, profile.email, updateProfile]);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <AuthProfileSync />
            <Root />
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

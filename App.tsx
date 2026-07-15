import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StoreProvider, useStore } from './src/store/StoreContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { LanguageProvider, useLang, tr } from './src/i18n/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { seed } from './src/store/seed';
import { registerPushToken } from './src/lib/push';
import { UpdateGate } from './src/components/UpdateGate';

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
        {tr({
          en: 'Changes could not be saved — storage is full. Please free up space.',
          ko: '저장 공간이 부족해 변경사항이 저장되지 않았습니다. 공간을 확보해 주세요.',
        })}
      </Text>
    </View>
  );
}

function Root() {
  const { scheme } = useTheme();
  const { lang } = useLang();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* ponytail: 언어 변경 시 key로 네비게이터를 remount해 tr() 텍스트 전체를 갱신한다.
          (위치 초기화 감수 — 드문 액션). 위치 유지가 필요해지면 useLang() 구독 훅으로 전환. */}
      <UpdateGate>
        <RootNavigator key={lang} />
      </UpdateGate>
      <PersistErrorBanner />
    </>
  );
}

// 로그인 사용자를 로컬 프로필에 반영(향후 동기화의 신원 소스).
// 계정(email)이 바뀔 때만 닉네임을 다시 세팅한다 → 같은 계정 재로그인 시엔 건드리지 않아
// 사용자가 ProfileEdit에서 바꾼 닉네임이 유지된다. 닉네임 우선순위: displayName → 이메일 앞부분.
function AuthProfileSync() {
  const { user } = useAuth();
  const { profile, updateProfile } = useStore();
  React.useEffect(() => {
    if (!user) return;
    const email = user.email ?? '';
    if (!email) return;
    const desired = user.displayName?.trim() || email.split('@')[0] || tr({ en: 'User', ko: '사용자' });
    const accountChanged = email !== profile.email;
    const nameIsSeedDefault = profile.name === seed.profile.name; // 시드 기본값 = 사용자가 정한 게 아님
    if (accountChanged) {
      updateProfile({ name: desired, email }); // 계정 바뀜 → 새 계정 정보로
    } else if ((nameIsSeedDefault || !profile.name) && profile.name !== desired) {
      updateProfile({ name: desired }); // 같은 계정인데 이름이 시드 기본값이면 교정(사용자 편집은 유지)
    }
  }, [user, profile.email, profile.name, updateProfile]);
  return null;
}

// 로그인 사용자의 원격 push 토큰을 발급·저장(EAS projectId 없으면 조용히 스킵). 로컬 알림과 무관.
function PushRegistrar() {
  const { user } = useAuth();
  React.useEffect(() => {
    if (user) void registerPushToken(user.uid);
  }, [user]);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider>
              <AuthProfileSync />
              <PushRegistrar />
              <Root />
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

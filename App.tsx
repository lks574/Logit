import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StoreProvider, syncSignature, useStore } from './src/store/StoreContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { LanguageProvider, useLang, tr } from './src/i18n/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { seed } from './src/store/seed';
import { registerPushToken } from './src/lib/push';
import { UpdateGate } from './src/components/UpdateGate';
import { fetchBackup } from './src/lib/cloudBackup';

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

// 새 기기/브라우저에서 로그인했을 때 로컬 콘텐츠가 비어 있으면 해당 계정의 마지막
// Firestore 백업을 한 번 자동 복원한다. 이미 로컬 콘텐츠가 있으면 덮어쓰지 않으며,
// 이후의 명시적 백업/복원은 마이 화면에서 사용자가 직접 선택한다.
function CloudBackupAutoRestore() {
  const { user } = useAuth();
  const { ready, records, plans, customActivities, replaceAll } = useStore();
  const contentCounts = React.useRef({ records: records.length, plans: plans.length, activities: customActivities.length });
  contentCounts.current = { records: records.length, plans: plans.length, activities: customActivities.length };

  React.useEffect(() => {
    if (!ready || !user) return;

    let cancelled = false;
    const key = `logit.auto-restore.v1.${user.uid}`;
    const isEmpty = () => {
      const counts = contentCounts.current;
      return counts.records === 0 && counts.plans === 0 && counts.activities === 0;
    };

    void (async () => {
      try {
        if (await AsyncStorage.getItem(key)) return;

        // 다른 계정이나 게스트가 만든 로컬 데이터는 자동으로 덮어쓰지 않는다.
        if (!isEmpty()) {
          await AsyncStorage.setItem(key, '1');
          return;
        }

        const backup = await fetchBackup(user.uid);
        if (cancelled) return;
        if (backup?.data && isEmpty()) {
          const restored = {
            ...backup.data,
            backupSignature: syncSignature(backup.data),
          };
          await replaceAll(restored);
        }
        if (!cancelled) await AsyncStorage.setItem(key, '1');
      } catch (e) {
        // 네트워크 오류는 마커를 남기지 않아 다음 실행에서 다시 시도한다.
        console.warn('[cloud-backup] 자동 복원 실패', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.uid]);

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
              <CloudBackupAutoRestore />
              <Root />
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

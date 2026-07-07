import React from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  reload,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../lib/firebase';
import { googleWebClientId, googleIosClientId, isFirebaseConfigured } from '../lib/firebaseConfig';
import { tr } from '../i18n/i18n';

type Status = 'loading' | 'authed' | 'unauthed';

// 앱이 필요로 하는 최소 user 형태(Firebase User가 구조적으로 만족). mock도 이 형태를 만든다.
export type AppUser = { uid: string; email: string | null; displayName: string | null; emailVerified: boolean };

type AuthContextValue = {
  status: Status;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nickname: string, email: string, password: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerified: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ponytail: Firebase config가 없을 때 쓰는 로컬 mock 인증. 아무 이메일/비번으로 로그인되고
// AsyncStorage로 세션만 유지한다(검증·네트워크 없음). firebaseConfig를 채우면 자동으로 실제 인증으로 전환.
const MOCK_KEY = 'logit-mock-auth';
const credError = () => {
  const e: any = new Error(tr({ en: 'Please enter your email and password.', ko: '이메일과 비밀번호를 입력해주세요.' }));
  e.code = 'auth/invalid-credential';
  return e;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [status, setStatus] = React.useState<Status>('loading');

  React.useEffect(() => {
    if (isFirebaseConfigured) {
      return onAuthStateChanged(auth, (u) => {
        setUser(u);
        setStatus(u ? 'authed' : 'unauthed');
      });
    }
    // mock: 저장된 세션 복원.
    AsyncStorage.getItem(MOCK_KEY)
      .then((raw) => {
        const u = raw ? (JSON.parse(raw) as AppUser) : null;
        // 구버전 저장값엔 uid가 없을 수 있음 → 이메일 기반으로 보정.
        if (u && !u.uid) u.uid = `mock-${(u.email ?? '').toLowerCase()}`;
        setUser(u);
        setStatus(u ? 'authed' : 'unauthed');
      })
      .catch(() => setStatus('unauthed'));
  }, []);

  const mockSignIn = async (email: string, displayName?: string) => {
    const u: AppUser = {
      uid: `mock-${email.trim().toLowerCase()}`, // 이메일 기반 안정 id(mock 전용)
      email: email.trim(),
      displayName: displayName?.trim() || email.trim().split('@')[0] || tr({ en: 'Logger', ko: '기록하는 사람' }),
      emailVerified: true, // mock은 인증 게이트를 건너뛴다(메일 발송 불가).
    };
    await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(u));
    setUser(u);
    setStatus('authed');
  };

  const value: AuthContextValue = {
    status,
    user,
    signIn: async (email, password) => {
      if (!isFirebaseConfigured) {
        if (!email.trim() || !password) throw credError();
        return mockSignIn(email);
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    signUp: async (nickname, email, password) => {
      if (!isFirebaseConfigured) {
        if (!email.trim() || !password) throw credError();
        return mockSignIn(email, nickname);
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (nickname.trim()) await updateProfile(cred.user, { displayName: nickname.trim() });
      await sendEmailVerification(cred.user);
    },
    resendVerification: async () => {
      if (!isFirebaseConfigured) return;
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    },
    refreshVerified: async () => {
      if (!isFirebaseConfigured) return true;
      if (!auth.currentUser) return false;
      await reload(auth.currentUser);
      setUser(auth.currentUser);
      return auth.currentUser.emailVerified;
    },
    resetPassword: async (email) => {
      if (!isFirebaseConfigured) return; // mock: 성공한 척.
      await sendPasswordResetEmail(auth, email.trim());
    },
    updateDisplayName: async (name) => {
      const displayName = name.trim();
      if (!isFirebaseConfigured) {
        const next: AppUser = { uid: user?.uid ?? `mock-${(user?.email ?? '').toLowerCase()}`, email: user?.email ?? null, displayName, emailVerified: true };
        await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(next));
        setUser(next);
        return;
      }
      if (!auth.currentUser) return;
      await updateProfile(auth.currentUser, { displayName });
      // 프로필 변경은 onAuthStateChanged를 안 태우므로 스냅샷으로 context 갱신.
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        emailVerified: auth.currentUser.emailVerified,
      });
    },
    signInWithGoogle: async () => {
      if (!isFirebaseConfigured) return mockSignIn('google.user@logit.dev', tr({ en: 'Google User', ko: 'Google 사용자' }));
      const { GoogleSignin } = await loadGoogleSignin();
      GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId });
      await GoogleSignin.hasPlayServices();
      const res: any = await GoogleSignin.signIn();
      const idToken = res?.data?.idToken ?? res?.idToken;
      if (!idToken) throw new Error(tr({ en: 'Couldn’t get an idToken from Google sign-in.', ko: 'Google 로그인에서 idToken을 받지 못했어요.' }));
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    },
    signInWithApple: async () => {
      if (!isFirebaseConfigured) return mockSignIn('apple.user@logit.dev', tr({ en: 'Apple User', ko: 'Apple 사용자' }));
      const AppleAuthentication = await loadAppleAuth();
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error(tr({ en: 'Couldn’t get a token from Apple sign-in.', ko: 'Apple 로그인에서 토큰을 받지 못했어요.' }));
      const provider = new OAuthProvider('apple.com');
      await signInWithCredential(auth, provider.credential({ idToken: credential.identityToken }));
    },
    logout: async () => {
      if (!isFirebaseConfigured) {
        await AsyncStorage.removeItem(MOCK_KEY);
        setUser(null);
        setStatus('unauthed');
        return;
      }
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// 네이티브 모듈 지연 로드 — 미설치/미빌드 환경에서 앱이 죽지 않도록.
async function loadGoogleSignin() {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(tr({ en: 'Google sign-in module is missing. Please rebuild the dev build.', ko: 'Google 로그인 모듈이 없어요. dev 빌드를 재생성해주세요.' }));
  }
}
async function loadAppleAuth() {
  try {
    return await import('expo-apple-authentication');
  } catch {
    throw new Error(tr({ en: 'Apple sign-in module is missing. Please rebuild the dev build.', ko: 'Apple 로그인 모듈이 없어요. dev 빌드를 재생성해주세요.' }));
  }
}

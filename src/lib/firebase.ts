import { initializeApp, getApps, getApp } from 'firebase/app';
// getReactNativePersistence는 RN 빌드(index.rn)에만 있어 메인 타입에는 노출되지 않는다 → ts-ignore.
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

// 앱은 HMR/재실행에서 initializeApp이 중복 호출될 수 있으니 기존 인스턴스 재사용.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth는 앱당 1회만 허용 → 이미 초기화됐으면 getAuth로 폴백.
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

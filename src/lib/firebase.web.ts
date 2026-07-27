import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// 브라우저는 Firebase 웹 Auth의 popup resolver와 기본 local persistence를 사용한다.
// 네이티브 전용 AsyncStorage persistence는 firebase.ts에서만 초기화한다.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = (() => {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
})();

export const auth = getAuth(app);

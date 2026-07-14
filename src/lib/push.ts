import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ensurePermission } from './notifications';

// 원격 push(Expo Push) 토큰을 발급받아 Firestore `pushTokens/{uid}`에 저장한다.
// 서버/Cloud Function이 이 토큰으로 Expo Push API에 쏘면 FCM(Android)·APNs(iOS)로 전달된다.
//
// ⚠️ EAS projectId 필요(`eas init` 후 app.json extra.eas.projectId). 없으면 토큰 발급 불가라
//    조용히 스킵한다 — 로컬 알림(약속 1시간 전)은 이와 무관하게 동작.
// ⚠️ Firestore 규칙: match /pushTokens/{uid} { allow write: if request.auth != null && request.auth.uid == uid; allow read: if false; }

export async function registerPushToken(uid: string): Promise<void> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) return; // EAS 미설정 → Expo push 토큰 발급 불가
  if (!(await ensurePermission())) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setDoc(
    doc(db, 'pushTokens', uid),
    { token, platform: Platform.OS, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// 푸시 토큰 문서 삭제(계정 삭제 시). 없으면 no-op.
export async function deletePushToken(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'pushTokens', uid));
}

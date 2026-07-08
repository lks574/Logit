import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from './firebase';

// 개발자에게 메세지 — Firestore `feedback` 컬렉션에 문서 1개 추가한다.
// 개발자는 Firebase 콘솔에서 확인. 별도 백엔드/이메일 인프라 없이 무료로 수집.
//
// ⚠️ Firestore 보안 규칙 필요(작성만 허용, 조회는 콘솔에서):
//   match /feedback/{id} { allow create: if request.auth != null; allow read: if false; }

const appVersion = Constants.expoConfig?.version ?? '?';

export async function sendFeedback(input: { message: string; uid: string; email: string | null }): Promise<void> {
  await addDoc(collection(db, 'feedback'), {
    message: input.message.trim(),
    uid: input.uid,
    email: input.email ?? null,
    appVersion,
    platform: Platform.OS,
    createdAt: serverTimestamp(),
  });
}

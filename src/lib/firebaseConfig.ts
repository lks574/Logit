// Firebase 웹 앱 config. Firebase 콘솔 → 프로젝트 설정 → "내 앱"(웹 앱).
// 웹 apiKey는 비밀이 아님(보안은 Auth/Firestore 규칙·API 키 제한·App Check로). 편의상 커밋해 둠.
// TODO(추후): 퍼블릭 노출이 신경 쓰이면 이 파일을 gitignore + example 분리로 되돌릴 것.
export const firebaseConfig = {
  apiKey: 'AIzaSyBnI_jyw38vG1RfgP8Z-ScAI-jkNHHQI6A',
  authDomain: 'logit-rn-54efa.firebaseapp.com',
  projectId: 'logit-rn-54efa',
  storageBucket: 'logit-rn-54efa.firebasestorage.app',
  messagingSenderId: '471118776644',
  appId: '1:471118776644:web:7b88bf047ff422d309af11',
};

// Phase 2(Google) — Firebase 콘솔 Google provider 설정 시 발급되는 "웹 클라이언트 ID"(…apps.googleusercontent.com).
// GoogleSignin.configure({ webClientId })에 사용. iOS는 별도 iOS 클라이언트 ID/URL scheme도 필요.
export const googleWebClientId = 'REPLACE_ME.apps.googleusercontent.com';

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_ME';

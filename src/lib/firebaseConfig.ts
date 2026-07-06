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

// Google 로그인 — GoogleSignin.configure에 사용.
// webClientId: idToken audience(Firebase 연동용, Firebase 콘솔 Google provider "웹 SDK 구성").
// iosClientId: iOS OAuth 클라이언트(GoogleService-Info.plist의 CLIENT_ID). iOS URL scheme은 app.json plugin에.
export const googleWebClientId = '471118776644-a1cd687prh5gfub2749j5qo4k1afkto2.apps.googleusercontent.com';
export const googleIosClientId = '471118776644-fpuobd9pt7t54infcp0tle3uovu9i5be.apps.googleusercontent.com';

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_ME';

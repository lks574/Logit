// Firebase 웹 앱 config. Firebase 콘솔 → 프로젝트 설정 → "내 앱"(웹 앱 추가) 에서 복사.
// 이 값들은 비밀이 아니다(보안은 Auth/Firestore 규칙으로). 그래도 공개 레포면 gitignore 권장.
//
// TODO(사용자): 아래 placeholder를 실제 값으로 교체하고, Firebase 콘솔에서
//   Authentication → 로그인 방법 → 이메일/비밀번호(+ 나중에 Google/Apple) 활성화.
export const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

// Phase 2(Google) — Firebase 콘솔 Google provider 설정 시 발급되는 "웹 클라이언트 ID"(…apps.googleusercontent.com).
// GoogleSignin.configure({ webClientId })에 사용. iOS는 별도 iOS 클라이언트 ID/URL scheme도 필요.
export const googleWebClientId = 'REPLACE_ME.apps.googleusercontent.com';

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_ME';

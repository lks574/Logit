// Firebase Auth 에러코드 → 한국어 인라인 메시지. 알 수 없는 코드는 일반 문구로.
const MAP: Record<string, string> = {
  'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
  'auth/user-not-found': '가입되지 않은 이메일이에요.',
  'auth/wrong-password': '비밀번호가 일치하지 않아요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않아요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
  'auth/operation-not-allowed': '이 로그인 방식이 비활성화되어 있어요.',
};

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string } | null)?.code;
  if (code && MAP[code]) return MAP[code];
  return '문제가 발생했어요. 잠시 후 다시 시도해주세요.';
}

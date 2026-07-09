import { Platform } from 'react-native';

// 앱 버전 게이트 — semver(x.y.z) 비교 + Remote Config 값으로 강제/선택 업데이트 판정.

export type VersionGate = {
  latest: string; // 최신 버전
  minSupported: string; // 이 버전 미만은 강제 업데이트
};

// 스토어 URL은 고정값(RC로 관리 안 함). ⚠️ 스토어 등록 후 실제 URL로 교체 — iOS는 앱 ID 필요.
export const STORE_URL =
  Platform.select({
    ios: 'https://apps.apple.com/app/id0000000000',
    android: 'https://play.google.com/store/apps/details?id=com.sro.logit',
    default: '',
  }) ?? '';

export type GateStatus = 'ok' | 'optional' | 'force';

// a<b → -1, a==b → 0, a>b → 1. 자리수 다르면 빠진 자리는 0으로.
export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

// 현재 버전과 게이트로 상태 판정.
export function evalGate(current: string, gate: VersionGate): GateStatus {
  if (cmpVersion(current, gate.minSupported) < 0) return 'force';
  if (cmpVersion(current, gate.latest) < 0) return 'optional';
  return 'ok';
}

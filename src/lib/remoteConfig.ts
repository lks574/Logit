import remoteConfig from '@react-native-firebase/remote-config';
import { DEV_STATUS, DevStatus } from '../data/roadmap';

// 개발 현황을 Firebase Remote Config로 원격 갱신한다.
// 콘솔 파라미터: dev_status = DevStatus JSON 문자열. 미설정·실패 시 정적 DEV_STATUS로 폴백.
//
// ⚠️ @react-native-firebase 네이티브 모듈 — GoogleService-Info.plist(iOS) 필요 + dev build 재빌드.

const KEY = 'dev_status';

let configured = false;
async function ensureConfigured() {
  if (configured) return;
  configured = true;
  await remoteConfig().setConfigSettings({
    // 개발 중엔 즉시 반영 위해 0, 배포 시엔 캐시 위해 1시간.
    minimumFetchIntervalMillis: __DEV__ ? 0 : 3600_000,
  });
  await remoteConfig().setDefaults({ [KEY]: JSON.stringify(DEV_STATUS) });
}

function parse(raw: string): DevStatus | null {
  try {
    const v = JSON.parse(raw);
    if (typeof v?.operational !== 'boolean' || !Array.isArray(v?.items)) return null;
    return v as DevStatus;
  } catch {
    return null;
  }
}

// 원격 개발 현황 — 항상 유효한 DevStatus 반환(원격 실패 시 정적 폴백).
export async function fetchDevStatus(): Promise<DevStatus> {
  try {
    await ensureConfigured();
    await remoteConfig().fetchAndActivate();
    return parse(remoteConfig().getValue(KEY).asString()) ?? DEV_STATUS;
  } catch {
    return DEV_STATUS;
  }
}

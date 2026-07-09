import remoteConfig from '@react-native-firebase/remote-config';
import { DEV_STATUS, DevStatus } from '../data/roadmap';
import { VersionGate } from './version';

// 개발 현황·버전 게이트를 Firebase Remote Config로 원격 갱신한다.
// 콘솔 파라미터: dev_status = DevStatus JSON, version_gate = VersionGate JSON.
// 미설정·실패 시 코드 기본값으로 폴백.
//
// ⚠️ @react-native-firebase 네이티브 모듈 — GoogleService-Info.plist(iOS) 필요 + dev build 재빌드.

const KEY = 'dev_status';
const VERSION_KEY = 'version_gate';
// 기본값은 안전하게 — 미설정 시 강제/선택 업데이트가 뜨지 않도록 최소 버전을 낮게.
const DEFAULT_GATE: VersionGate = { latest: '1.0.0', minSupported: '0.0.0' };

let configured = false;
async function ensureConfigured() {
  if (configured) return;
  configured = true;
  await remoteConfig().setConfigSettings({
    // 개발 중엔 즉시 반영 위해 0, 배포 시엔 캐시 위해 1시간.
    minimumFetchIntervalMillis: __DEV__ ? 0 : 3600_000,
  });
  await remoteConfig().setDefaults({
    [KEY]: JSON.stringify(DEV_STATUS),
    [VERSION_KEY]: JSON.stringify(DEFAULT_GATE),
  });
}

// 원격 버전 게이트 — 실패·형식오류 시 안전 기본값(업데이트 안내 없음).
export async function fetchVersionGate(): Promise<VersionGate> {
  try {
    await ensureConfigured();
    await remoteConfig().fetchAndActivate();
    const v = JSON.parse(remoteConfig().getValue(VERSION_KEY).asString());
    if (typeof v?.minSupported === 'string' && typeof v?.latest === 'string') {
      return { latest: v.latest, minSupported: v.minSupported };
    }
    return DEFAULT_GATE;
  } catch {
    return DEFAULT_GATE;
  }
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

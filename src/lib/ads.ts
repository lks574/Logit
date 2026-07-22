import mobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// dev/테스트는 Google 테스트 ID, Release는 실제 보상형 광고단위(iOS).
// ponytail: iOS 단일 unit. Android 출시 시 Platform.select로 분기.
const REWARDED_UNIT = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8242072118866709/5592939699';
const REWARD_PASS_KEY = 'logit.ads.reward-pass-until.v1';
const REWARD_PASS_MS = 30 * 60 * 1000;

let initialized = false;
export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    await mobileAds().initialize();
  } catch {
    // 초기화 실패해도 이후 load/show에서 개별 처리.
  }
}

async function hasRewardPass(): Promise<boolean> {
  try {
    const until = Number(await AsyncStorage.getItem(REWARD_PASS_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

async function grantRewardPass(): Promise<void> {
  try {
    await AsyncStorage.setItem(REWARD_PASS_KEY, String(Date.now() + REWARD_PASS_MS));
  } catch {
    // 저장 실패 시에도 이번 요청의 보상은 유지하고 다음 요청에서 다시 광고를 노출한다.
  }
}

// 보상형 광고를 로드→노출. 한 번 보상을 얻으면 30분 동안 백업·내보내기·복원을
// 다시 막지 않는다. 이미 패스가 있거나 보상 획득 시 true, 닫힘/실패/타임아웃 시 false.
export async function showRewarded(): Promise<boolean> {
  if (await hasRewardPass()) return true;
  await initAds();
  return new Promise<boolean>((resolve) => {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT, { requestNonPersonalizedAdsOnly: true });
    let earned = false;
    let settled = false;
    const unsubs: (() => void)[] = [];
    let timer: ReturnType<typeof setTimeout>;
    const finish = (v: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubs.forEach((u) => u());
      resolve(v);
    };
    unsubs.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show().catch(() => finish(false));
      }),
    );
    unsubs.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    }));
    unsubs.push(ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (!earned) {
        finish(false);
        return;
      }
      grantRewardPass().finally(() => finish(true));
    }));
    unsubs.push(ad.addAdEventListener(AdEventType.ERROR, () => finish(false)));
    timer = setTimeout(() => finish(false), 20000); // 로드 지연 방지
    ad.load();
  });
}

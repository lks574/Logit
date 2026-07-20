import mobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// dev/테스트는 Google 테스트 ID, Release는 실제 보상형 광고단위(iOS).
// ponytail: iOS 단일 unit. Android 출시 시 Platform.select로 분기.
const REWARDED_UNIT = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8242072118866709/5592939699';

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

// 보상형 광고를 로드→노출. 보상 획득 시 true, 닫힘/실패/타임아웃 시 false.
export async function showRewarded(): Promise<boolean> {
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
    unsubs.push(ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)));
    unsubs.push(ad.addAdEventListener(AdEventType.ERROR, () => finish(false)));
    timer = setTimeout(() => finish(false), 20000); // 로드 지연 방지
    ad.load();
  });
}

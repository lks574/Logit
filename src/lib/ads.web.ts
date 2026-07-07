// Web 스텁 — react-native-google-mobile-ads는 네이티브 전용이라 web 빌드를 깬다.
// 웹 프리뷰(디버깅)에서는 광고 없이 게이트를 통과시킨다. Metro가 web 플랫폼에서 ads.ts 대신 이 파일을 쓴다.
export async function initAds(): Promise<void> {}
export async function showRewarded(): Promise<boolean> {
  return true;
}

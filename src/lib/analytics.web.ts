// Web 스텁 — posthog-react-native는 네이티브 전용. 웹 프리뷰(디버깅)에선 계측 no-op.
// Metro가 web 플랫폼에서 analytics.ts 대신 이 파일을 쓴다(ads.web.ts 패턴).
export async function initAnalytics(): Promise<void> {}
export function analyticsConsented(): boolean {
  return false;
}
export async function setAnalyticsConsent(_on: boolean): Promise<void> {}
export function track(_event: string, _props?: Record<string, string>): void {}
export function trackScreen(_name: string): void {}
export function identifyUser(_uid: string): void {}
export function resetUser(): void {}

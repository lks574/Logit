import AsyncStorage from '@react-native-async-storage/async-storage';

// PostHog 린 계측. 목적: "어느 템플릿을 실제로 쓰는가"(버티컬 심화 게이트 입력).
// 설계: docs/ANALYTICS_PLAN.md. 프라이버시 우선 — 기본 opt-out, 동의 후에만 전송, PII 금지.
//
// 무해 보장(3중):
//  1) API 키 없으면 posthog-react-native를 아예 require하지 않는다(지연 로드) →
//     키·재빌드 없이 도는 dev 빌드에서도 네이티브 접촉 0, 크래시 0.
//  2) 미동의(consented=false)면 모든 track/screen/identify가 즉시 no-op.
//  3) 웹은 analytics.web.ts 스텁(전부 no-op) — posthog-react-native는 네이티브 전용.

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = 'https://us.i.posthog.com';
const CONSENT_KEY = 'logit.analytics.consent';

let client: any = null;
let consented = false;

// PII 금지: Firebase uid를 그대로 보내지 않고 djb2 해시로 익명화(store의 syncSignature와 동일 계열).
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function ensureClient(): any {
  if (!KEY) return null; // 키 없으면 계측 자체를 끈다(require도 안 함)
  if (!client) {
    const PostHog = require('posthog-react-native').default;
    client = new PostHog(KEY, { host: HOST });
  }
  return client;
}

// 앱 시작 시 저장된 동의 상태 복원. 동의했고 키가 있으면 클라이언트 준비.
export async function initAnalytics(): Promise<void> {
  try {
    consented = (await AsyncStorage.getItem(CONSENT_KEY)) === '1';
  } catch {
    consented = false;
  }
  if (consented) ensureClient();
}

export function analyticsConsented(): boolean {
  return consented;
}

export async function setAnalyticsConsent(on: boolean): Promise<void> {
  consented = on;
  try {
    await AsyncStorage.setItem(CONSENT_KEY, on ? '1' : '0');
  } catch {}
  if (on) ensureClient();
  else client?.optOut?.(); // 끄면 이후 전송 중단(consented 게이트가 1차 방어)
}

export function track(event: string, props?: Record<string, string>): void {
  if (!consented) return;
  ensureClient()?.capture(event, props);
}

export function trackScreen(name: string): void {
  if (!consented) return;
  ensureClient()?.screen(name);
}

export function identifyUser(uid: string): void {
  if (!consented) return;
  ensureClient()?.identify(hash(uid));
}

export function resetUser(): void {
  client?.reset();
}

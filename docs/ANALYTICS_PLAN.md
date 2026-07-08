# 앱 사용성 분석 도입 계획

> 상태: **보류** — 추후 적용. (논의 2026-07-08)
> 목적: 실사용 동작 확인 · 사용자 플로우 · 기능 사용량을 파악해 추후 개편에 참고.

## 선정 도구: PostHog (무료)

무료 티어 월 100만 이벤트. **Firebase Analytics는 부적합**:
- 현재 깔린 `firebase` JS SDK의 analytics는 RN에서 안 돌아감(웹 전용, `window`/IndexedDB 의존).
- `@react-native-firebase/analytics` 네이티브 모듈을 붙여도 퍼널·플로우 분석 UI가 약함(BigQuery+SQL 필요).

PostHog는 Expo config plugin 지원, autocapture, Funnels·Paths·세션 리플레이 제공 → 아래 질문에 바로 답함.

| 알고 싶은 것 | PostHog 기능 |
|---|---|
| 실제 잘 동작하나 | 세션 리플레이 + 에러 이벤트 |
| 어떻게 사용하나 | 세션 리플레이 + Paths(경로 자동 그래프) |
| 특정 기능 잘 쓰나 | 이벤트별 카운트/트렌드 |
| 뭘 많이 쓰나 | 이벤트 랭킹 |
| 최다 플로우 | Funnels + Paths |

## 용량 감: 100만 이벤트 = 몇 MAU?

`이벤트/월 = MAU × 월 세션수 × 세션당 이벤트수`. Logit은 기록할 때 잠깐 여는 앱이라 세션이 짧고 드묾.

| 계측 방식 | 세션당 이벤트 | 유저당/월 | 1M 커버 MAU |
|---|---|---|---|
| **린(권장)**: 화면뷰 + 핵심액션 ~8개 | ~15 | ~150 | **~6,600명** |
| 중간: autocapture 탭 켬 | ~50 | ~500 | ~2,000명 |
| 풀 autocapture | ~150 | ~1,500 | ~660명 |

- **린으로 가면 수천 MAU까지 무료.** autocapture 탭은 끄고 유지할 것.
- ⚠️ 진짜 병목은 이벤트가 아니라 **세션 리플레이(무료 월 5,000건)**. 전부 녹화하면 수십 명에서 소진 → 쓸 거면 샘플링(예: 10%) 필수.

## 구현 순서 (재개 시)

1. `npx expo install posthog-react-native @react-native-async-storage/async-storage`
   - 키: `.env`에 `EXPO_PUBLIC_POSTHOG_KEY=...`, host `https://us.i.posthog.com`
2. **신규 `src/lib/analytics.ts`** — 싱글톤 + `track()` 헬퍼 (`src/lib/firebase.ts` 패턴 참고)
   ```ts
   import PostHog from 'posthog-react-native';
   export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
     host: 'https://us.i.posthog.com',
   });
   export const track = (event: string, props?: Record<string, any>) =>
     posthog.capture(event, props);
   ```
3. **`App.tsx`** — `<PostHogProvider client={posthog} autocapture={{ captureTouches: false }}>` 로 감싸기(AuthProvider 안쪽, 신원 붙이기 위해).
4. **`src/navigation/RootNavigator.tsx`** — 단일 `NavigationContainer`의 `onStateChange`에서 현재 route 이름 뽑아 `posthog.screen(name)`. 화면 전환 자동 추적 → 플로우 데이터 소스.
5. **신원 (PII 금지)** — `App.tsx`의 `AuthProfileSync` 근처: 로그인 시 `posthog.identify(hash(user.uid))`, 로그아웃 시 `posthog.reset()`. 이메일/이름 넣지 말 것.
6. **핵심 이벤트 ~8개** — 스토어 액션에 한 줄씩(`src/store/StoreContext.tsx`):
   `record_created` / `plan_created` / `plan_completed` / `record_deleted`
   \+ `onboarding_completed` / `signup` / `login` / `stats_viewed`
   → 이 8개로 시작하고 필요할 때 추가(처음부터 다 찍으면 대시보드에서 못 찾음).
7. **개인정보 (KR)** — 설정에 "사용 분석 허용" 토글 추가 → `posthog.optIn()/optOut()`, 동의 전 opt-out 상태로 시작. 약관/개인정보처리방침 화면 이미 존재.

## 결정 필요 (재개 시)

- **세션 리플레이 사용 여부**: 쓰면 버그 재현에 좋으나 5천건 한도라 샘플링 필수 + config plugin/dev build 재빌드 필요. 안 쓰면 셋업 더 간단.

# Logit 로드맵 — 리텐션 우선 실행 스펙

> 작성 2026-07-14. 사용자 관점 경쟁 분석(운동=번핏·플랜핏·Hevy, 러닝=Strava·NRC, 공연=티켓스토리)에서 도출.
> 각 항목은 **작업 가능 시점에 바로 착수할 수 있는 수준**으로 스코프·파일·수용 기준을 명시한다.

## 전략 한 줄

Logit의 포지션은 "이종 활동의 단일 타임라인 + 약속→기록 루프"(버티컬 앱들이 못 하는 것).
리텐션 최대 위협은 기능 부족이 아니라 **수동 입력 마찰**.

> **판별 기준: 그 작업이 "타이핑을 줄이면" 한다. "화면·기능을 늘리면" 하지 않는다.**

### 하지 않을 것 (non-goals — 버티컬 추격전 금지)
- 휴식 타이머·운동 DB·루틴 추천 (번핏/플랜핏 추격전)
- 자체 GPS 트래킹 (Strava 추격전 — HealthKit 가져오기가 90% 대체)
- 예매내역 자동 파싱 (인터파크/예스24 화면 변경마다 깨짐 — 유지보수 지옥)
- 버티컬 심화는 P4 계측 데이터가 가리킬 때만 (§게이트)

## 우선순위 (비용·의존성 순)

| 순서 | 작업 | 예상 규모 | 의존성 |
|---|---|---|---|
| P1 | ~~지난 기록 프리필 — 전 폼 확산~~ **완료 2026-07-14** | 반나절 | 없음 (패턴 완성됨) |
| P2 | ~~공유 카드~~ **완료 2026-07-15** | 1–2일 | dep 1개 추가 |
| P3 | HealthKit 워크아웃 가져오기 (iOS) | 3–5일 | dev 빌드 재생성 |
| P4 | PostHog 계측 | 1일 | `docs/ANALYTICS_PLAN.md` |

P1·P2는 웹 프리뷰/시뮬레이터로 검증 가능. P3은 실기기 필수(`docs/DEVICE_TESTING.md`).

---

## P1. 지난 기록 프리필 — 전 폼 확산

**목표**: 반복 기록의 타이핑 제거. 번핏 "10초 기록"에 대응하는 최소 비용 답.

**상태**: ✅ 완료(2026-07-14) — 배너를 `src/components/PrefillBanner.tsx`로 추출, 6개 폼 전체 적용. 웹 프리뷰에서 SetRep(부위·운동시간)·Spectate(작품·공연장·출연진·회차 자동)·Endurance(회귀) 확인, `tsc` 클린.
- 패턴 위치: `src/screens/add/forms/EnduranceForm.tsx`
  - `lastRecord` useMemo (94–98행): `records.find(r => r.activity === activity && r.id !== recordId)` — records가 최신순이라 find로 충분.
  - `prefillFromLast()` (99–109행): 복사할 필드만 골라 state에 주입.
  - 배너 Pressable (176행~): `!editing && lastRecord` 일 때만 노출, `accentSoft` 배경.

**폼별 복사 필드** (원칙: *다음 세션의 시작점이 되는 값*만. 날짜·사진·메모·평점·기분은 항상 제외):

| 폼 | 복사 | 제외 (매번 다름) |
|---|---|---|
| `SetRepForm` | 부위, 세트 rows(`fields.세트` JSON.parse), 운동시간, 장소 | 총볼륨(세트에서 재계산되면 그대로 둠) |
| `MatchForm` | 종목(sportKey), 나, 상대, 장소 | 스코어, 결과, 종목별 슬롯 값 |
| `SpectateForm` | 작품, 공연장, 출연진 (재관람러 대응) | 좌석, 회차, 티켓 |
| `FreeForm` | 제목, 시간, 강도, 장소 | — |
| `CampingForm` | 장소, 지역, 분류 | 기간(마지막일) |

**주의**
- SetRep `fields.세트`는 JSON 문자열 — parse 실패 시 무시(try/catch).
- Match는 `fields.종목`(sportKey)을 먼저 복원해야 슬롯 스키마가 맞는다(`src/data/sports.ts`).
- 배너 문구·스타일은 EnduranceForm과 동일하게 (일관성).

**수용 기준**: 각 폼에서 같은 활동 기록이 있을 때 배너 노출 → 탭 → 위 표의 필드 채워짐. 편집 모드에선 미노출. `tsc --noEmit` 클린. 웹 프리뷰에서 5개 폼 라운드트립 확인.

---

## P2. 공유 카드

**목표**: 기록 1건 → 이미지 카드 → 인스타/카톡 공유. 유일한 유기적 확산 루프(레포브류가 증명한 패턴).

**상태**: ✅ 완료(2026-07-15) — `react-native-view-shot` 도입, `ShareCard.tsx`(4:5 고정 라이트 카드)·`shareCard.ts`(+웹 스텁)·Glyph `share` 아이콘 추가, DetailScreen 헤더 공유 버튼(웹 숨김)+오프스크린 캡처 뷰 배선. 웹 프리뷰에서 카드 렌더·버튼 숨김·콘솔 클린 확인. **실제 캡처+공유는 네이티브 전용** — dataTransfer.ts와 동일 지연 require 패턴, iOS 시뮬레이터/실기기 최종 확인 필요.

**스코프**
- in: DetailScreen 헤더 공유 버튼 → 카드 캡처 → OS share sheet.
- out: 웹(버튼 숨김), 통계/주간 요약 카드(후속), 커스텀 편집.

**구현**
1. dep: `react-native-view-shot` (Expo 지원, config plugin 불필요). 공유는 기존 `expo-sharing` 재사용.
2. 신규 `src/components/ShareCard.tsx` — 오프스크린 렌더용 고정 크기 카드(1080×1350, 인스타 4:5):
   - 템플릿색 배경(`colorsFor`), 활동 아이콘(`iconFor`), 날짜, `meta`, 핵심 필드 2–3개, 별점, 사진 1장(있으면), 하단 "Logit" 워터마크.
   - 테마 무관 고정 팔레트(공유물은 항상 라이트) — 다크모드 캡처 오염 방지.
3. 신규 `src/lib/shareCard.ts` — `captureRef` → tmp png → `Sharing.shareAsync`. 웹은 no-op(`shareCard.web.ts`, `ads.web.ts` 패턴).
4. `src/screens/shared/DetailScreen.tsx` 헤더에 공유 IconButton. 캡처 대상은 화면 밖(absolute, opacity 0 금지 — `collapsable={false}` + 화면 밖 좌표) 렌더.

**수용 기준**: iOS 시뮬레이터에서 러닝·뮤지컬 기록 각 1건 공유 → share sheet에 4:5 이미지. 사진 없는 기록도 카드 성립. 웹에서 버튼 미노출.

---

## P3. HealthKit 워크아웃 가져오기 (iOS 먼저)

**목표**: 유산소 자동 기록. "손으로 치는 앱" 탈출의 핵심. Android(Health Connect)는 후속 — 현재 검증 기기가 iOS.

**스코프**
- in: 최근 30일 HKWorkout **읽기** → 목록에서 선택 → EnduranceForm 프리필 → 사용자가 확인·저장.
- out: 백그라운드 자동 import, Logit→Health 쓰기, 심박 시계열, Android.

**구현**
1. dep: `@kingstinct/react-native-healthkit` (config plugin·New Arch 지원). `app.json` plugins에 추가 + `NSHealthShareUsageDescription` 문구. **CNG 재생성 필요** → `npm run ios`.
2. 신규 `src/lib/health.ts`:
   - `fetchRecentWorkouts(days=30)` → `{ uuid, activityKey, dateISO, timeLabel, fields }[]`
   - HKWorkoutActivityType 매핑: running→런닝, cycling→자전거, swimming→수영, walking/hiking→걷기(카탈로그에 없으면 `src/data/activities.ts`에 추가). 그 외 타입은 목록에서 제외(MVP).
   - fields 조립: 거리 `"5.21km"`, 시간 `"27:12"`, 칼로리 — 기존 폼 저장 형식과 동일 문자열.
   - 웹/미지원 폴백 `health.web.ts` (빈 배열).
3. 중복 방지: `src/store/types.ts` `StoredRecord`에 `externalId?: string` 추가(workout UUID). 백업/가져오기 스키마는 옵셔널 필드라 마이그레이션 불필요(`logit.store.v1` 유지).
4. 신규 `src/screens/settings/HealthImportScreen.tsx`: 워크아웃 목록(날짜·활동·거리·시간), 이미 import된 UUID는 "가져옴" 뱃지. 탭 → `RecordForm`으로 이동.
5. 프리필 전달: `RecordFormScreen` route params에 `prefill?: { fields, dateISO, timeLabel, externalId }` 추가 — 기존 `plan` 프리필과 병렬 구조. EnduranceForm이 `prefill` 있으면 초기 state로 사용, 저장 payload에 `externalId` 포함.
6. 진입점: `src/screens/settings/MyScreen.tsx` "내 데이터" 섹션에 "건강 데이터 가져오기" 행(iOS만 노출).

**수용 기준**: 실기기에서 건강 앱 워크아웃 1건 → 목록 표시 → 저장 → 홈/캘린더/통계 반영 → 재진입 시 "가져옴" 표시(중복 저장 불가). 권한 거부 시 안내 문구. 웹·시뮬레이터에서 크래시 없음(빈 목록).

---

## P4. PostHog 계측

**목표**: "어느 템플릿을 실제로 쓰는가" 데이터 확보 → 버티컬 심화 게이트의 입력.

**구현**: `docs/ANALYTICS_PLAN.md` 그대로 (린 계측 ~8 이벤트, opt-in 토글, PII 금지). 단 하나 추가:
- `record_created` props: `{ template, activity }` — **activity는 빌트인만 실명, 커스텀 활동은 `'custom'`으로 마스킹**(사용자 생성 텍스트 전송 금지).
- `plan_completed`에도 `{ template }` (약속→기록 루프 건강도).

**수용 기준**: PostHog 대시보드에서 템플릿별 record_created 분포 + plan→record 전환 퍼널 조회 가능.

---

## 버티컬 심화 게이트 (P4 이후 4주+ 데이터로 판단)

| 데이터가 말하면 | 그때 여는 작업 |
|---|---|
| setrep 압도적 + 주 3회↑ 유저 존재 | 세트 입력 UX 심화(직전 세트 개별 복사 등) — 그래도 운동 DB·타이머는 금지 |
| match 비중 높음 | 아마추어 경기 개인 통계(상대 전적·승률) — 뚜렷한 경쟁자 없는 영역 |
| spectate 비중 높음 | 티켓 사진 첨부 UX·작품별 관람 히스토리 강화 |
| endurance 압도적 | Health Connect(Android) 조기 착수 |

데이터 없이 이 표의 작업을 시작하지 않는다.

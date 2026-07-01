# Logit 데이터 모델링 문서

> 대상 코드: `src/store/types.ts`, `src/store/seed.ts`, `src/store/selectors.ts`,
> `src/store/StoreContext.tsx`, `src/data/activities.ts`, `src/theme/tokens.ts`
> 원칙: **오프라인 우선(offline-first)** · **템플릿 기반 유연 스키마** · **평평한 확장형 활동 목록**

---

## 1. 핵심 설계 결정 — 왜 이렇게 모델링했나

### 1.1 종목을 고정 그룹으로 묶지 않는다
디자인 리뷰에서 확정된 결정(README §정보구조): 종목(축구·배드민턴·요가·독서…)은 **무한히 늘어난다.**
그래서 "팀 경기", "구기 종목" 같은 **고정 카테고리로 묶지 않는다.** 대신 두 축으로 분리한다.

| 축 | 무엇 | 확장 방식 |
|---|---|---|
| **활동(Activity)** | 사용자가 기록하는 대상 (런닝, 배드민턴…) | **평평한 목록** — 무한 추가 |
| **기록 템플릿(Template)** | 활동을 담는 폼의 "모양" (5종 고정) | **닫힌 집합** — 앱이 정의 |

새 종목이 생겨도 **템플릿만 고르면** 폼·통계·캘린더에 즉시 반영된다. 앱 업데이트 불필요.
→ 이 결정이 전체 스키마를 지배한다. `Record`가 종목별 컬럼을 갖는 대신, **템플릿 타입 + 유연 필드 맵(`fields`)** 을 갖는 이유.

### 1.2 오프라인 우선
로컬(AsyncStorage)이 **단일 진실 원천**. 쓰기는 즉시 로컬 반영 → 백그라운드 동기화(후속).
충돌 정책은 last-write-wins. 동기화 상태는 레코드별 `sync` 필드로 표면화(SyncStatusBadge).

---

## 2. 엔티티 개요 (ERD)

```
                 ┌──────────────────────────┐
                 │  Activity (catalog)       │   name = 조인 키(문자열)
                 │  ─ builtin: activities{}  │◄────────────┐
                 │  ─ custom : CustomActivity│             │ activity(name)
                 │    { name, template }     │             │
                 └──────────┬───────────────┘             │
                            │ template                     │
                            ▼                              │
              ┌──────────────────────────┐                │
              │ TemplateType (5종, enum)  │                │
              │ endurance/setrep/match/   │                │
              │ spectate/free             │                │
              │  → color · icon · fields  │                │
              └──────────────────────────┘                │
                                                           │
     ┌─────────────────────────┐        ┌─────────────────┴────────┐
     │ Record (한 일)          │        │ Plan (약속한 것)          │
     │ { id, activity, template,│        │ { id, activity, template, │
     │   dateISO, timeLabel,    │        │   dateISO, timeLabel,     │
     │   meta, rating,          │        │   place, memo,            │
     │   companions[], photos[],│        │   reminder, done }        │
     │   memo, fields{}, sync }  │        └───────────────────────────┘
     └─────────────────────────┘
```

- **조인 키는 `activity`(문자열 이름).** 정규화된 FK(id) 대신 이름을 쓴다 — 활동 카탈로그가
  작고(빌트인 15 + 사용자 소수), 이름이 곧 표시 라벨이라 조인/렌더가 단순해진다.
  (규모가 커지면 `activityId`로 승격 가능 — §8 참고.)
- 활동 이름 → 아이콘/템플릿/색은 `activities` 레지스트리에서 해석(`src/data/activities.ts`).

---

## 3. 엔티티 상세 스키마

### 3.1 Activity — 활동 카탈로그
활동은 **두 소스**로 나뉜다. 표시 시 둘을 병합한다.

**(a) 빌트인 카탈로그** — `src/data/activities.ts` 정적 레지스트리
```ts
type Activity = { name: string; template: TemplateType; icon: IconName };
// 예: 런닝→endurance/running, 헬스→setrep/dumbbell, 축구→match/soccer,
//     뮤지컬→spectate/performance, 요가→free/yoga … (총 15종)
```
빌트인은 **아이콘까지** 지정(디자인 stroke 아이콘). 앱에 하드코딩되어 번들에 포함.

**(b) 사용자 정의 활동** — `src/store/types.ts`, 스토어에 저장/영속
```ts
type CustomActivity = { name: string; template: TemplateType };
```
사용자 정의는 **아이콘을 안 받는다.** 렌더 시 템플릿 기본 색(`colorsFor`) + 기본 아이콘
(`Icon.yoga`)으로 폴백. (아이콘 선택 UI는 있으나 MVP에선 색만 반영 — §7 단순화.)

> 왜 아이콘을 빌트인만? 아이콘은 인라인 SVG 컴포넌트라 문자열로 직렬화해 저장하기 어렵다.
> 사용자 정의는 "템플릿만 고르면 즉시 동작"이 목표이므로 아이콘은 선택적 장식으로 취급.

### 3.2 TemplateType — 기록 템플릿 (5종, 닫힌 집합)
`src/theme/tokens.ts`
```ts
type TemplateType = 'endurance' | 'setrep' | 'match' | 'spectate' | 'free';
```
각 템플릿은 **색 + soft색 + 코어 필드**를 정의한다. 색 매핑은 `templateColor`:

| Template | 한글 | 색 (`Palette` 키) | 코어 필드(폼) | 예시 종목 |
|---|---|---|---|---|
| `endurance` | 거리·시간형 | `cardio` / `cardioSoft` (#2F8F83) | 거리·시간·페이스·심박 | 런닝, 자전거, 수영 |
| `setrep` | 세트·횟수형 | `strength` / `strengthSoft` (#C2724B) | 부위·세트·반복·중량 | 헬스, 클라이밍 |
| `match` | 대전·경기형 | `team` / `teamSoft` (#4A6FA5) | 상대·스코어·결과·슬롯 | 축구, 배드민턴, 야구 |
| `spectate` | 관람·공연형 | `perf` / `perfSoft` (#8A6BA8) | 작품·장소·좌석·출연진 | 뮤지컬, 콘서트 |
| `free` | 자유 기록형 | `accent` / `accentSoft` (#3D5A80) | 시간·강도·평점·메모 | 요가, 독서, 그 외 |

해석 헬퍼:
```ts
colorsFor(template, palette) => { color, soft }   // 템플릿 → 실제 hex
templateColor[template]      => { color: keyof Palette, soft: keyof Palette }
```

> **match 템플릿의 핵심 설계**: 팀/개인을 구분하지 않는다. "우리·상대 + 스코어 + 결과"는
> 축구·배드민턴 공통. 종목별로 다른 부분은 **"핵심 기록 슬롯"만 교체**(축구=골/어시스트,
> 배드민턴=최장 랠리/에이스). → `Record.fields`에 슬롯 값이 들어가고, 폼의 종목 레지스트리가
> 슬롯 라벨을 스왑. 하드코딩 토글 없음(`MatchForm.tsx`의 `SPORTS` 레지스트리).

### 3.3 Record — 한 일(완료된 기록)
`src/store/types.ts`
```ts
type StoredRecord = {
  id: string;                     // uid('r-…') 자동 생성
  activity: string;               // 활동 이름 (조인 키)
  template: TemplateType;         // 어떤 폼으로 기록됐나 → 색/렌더 분기
  dateISO: string;                // 'YYYY-MM-DD' 캘린더 일자 (마커/아젠다 그룹핑 키)
  timeLabel: string;              // 표시용 시각 라벨 '오후 6:30' / '어제' / '방금'
  meta?: string;                  // 카드 1줄 요약 '한강공원 · 5.2km · 27′12″'
  rating?: number;                // 별점 0–5
  companions?: string[];          // 동행 이름들 (CompanionChip)
  photos?: string[];              // 이미지 uri (expo-image-picker 결과)
  memo?: string;                  // 자유 메모
  fields?: Record<string, string>;// ★ 템플릿별 유연 필드 (templateFields)
  sync: 'synced' | 'pending';     // 동기화 상태
};
```

**설계 포인트**
- `dateISO`(그룹핑용) 와 `timeLabel`(표시용)을 **분리**. 캘린더/통계는 `dateISO`로 계산,
  카드에는 사람이 읽는 `timeLabel`을 그대로 노출("어제", "방금" 같은 상대 표현 허용).
- `meta`는 **비정규화된 표시 문자열**. 카드가 매번 필드를 조립하지 않도록 저장 시 1줄로 만들어 둠
  (읽기 경로 단순화). 상세 화면은 `fields`(정규 데이터)로 표를 그림.
- `fields`가 **유연 스키마의 핵심**. 템플릿마다 키가 다르다:
  - endurance → `{ 거리, 시간, 페이스, 고도, 칼로리, 평균심박 }`
  - match → `{ 스코어, 결과, 골, 어시스트 … }` (슬롯이 그대로 키가 됨)
  - spectate → `{ 작품, 공연장, 회차 }`
  DB 스키마 변경 없이 종목·템플릿이 늘어나도 흡수. (README의 `templateFields{}` 제안 그대로.)

### 3.4 Plan — 약속한 것(예정)
```ts
type StoredPlan = {
  id: string;                     // uid('p-…')
  activity: string;               // 활동 이름
  template: TemplateType;
  dateISO: string;                // 'YYYY-MM-DD' — D-day 계산 기준
  timeLabel: string;              // '오후 8:00'
  place?: string;                 // 장소
  memo?: string;
  reminder?: boolean;             // 알림 on/off
  done?: boolean;                 // 완료(기록으로 전환) 여부
};
```
- `Record`와 거의 대칭이나 **결과 데이터(rating/fields/photos)가 없다** — 아직 안 일어난 일.
- `done`으로 "약속 → 완료" 라이프사이클 표현. 캘린더/홈은 `!done` 인 미래 약속만 노출.
  (완료 시 Record로 전환하는 플로우는 후속 — 현재는 `completePlan`이 `done=true` 만 처리.)

---

## 4. 영속화 (Persistence)

`src/store/StoreContext.tsx` — React Context + AsyncStorage.

```
앱 시작 → AsyncStorage.getItem('logit.store.v1')
          ├─ 값 있음 → JSON.parse 로 복원(rehydrate)
          └─ 없음   → seed(디자인 목업 데이터)로 초기화
상태 변경 → (ready 이후) AsyncStorage.setItem 으로 직렬화 저장
```

- **저장 단위**: `StoreState = { records[], plans[], customActivities[] }` 전체를 **하나의 JSON blob**으로 저장.
- **키 버저닝**: `logit.store.v1` — 스키마 변경 시 `v2`로 올리고 마이그레이션(§8).
- **rehydrate 가드**: `ready` 플래그가 true가 되기 전엔 setItem을 하지 않아,
  복원 완료 전 seed가 저장소를 덮어쓰는 것을 방지.
- **id 생성**: `uid(prefix)` = `${prefix}-${Date.now(36)}-${rand(36)}` (앱 런타임에서만 사용).

> **ponytail 결정**: WatermelonDB/SQLite 대신 AsyncStorage + Context.
> 데이터가 단일 사용자·수백 건 규모라 JSON blob으로 충분. 쿼리·인덱스·대용량이 필요해지면
> 이 파일의 영속 계층만 SQLite로 교체(엔티티 타입·화면 코드는 불변).

---

## 5. 동기화 상태 모델 (offline-first 표면화)

```
addRecord() → sync: 'pending'  ──(≈1.5s 후)──▶  sync: 'synced'
```
- 새 레코드는 항상 `pending`으로 생성 → 타이머로 `synced` 전환(백그라운드 동기화 시뮬레이션).
- `useSyncState()`: 하나라도 `pending`이면 `'pending'`, 아니면 `'synced'`.
  (`'offline'` 상태는 타입에 존재 — 실제 네트워크 감지는 후속.)
- 홈 헤더 `SyncStatusBadge`가 이 값을 구독 → 저장 직후 "대기 중" → "동기화됨" 전이가 보인다.

> 색 단독 금지 원칙: 배지는 항상 **점 + 텍스트** 병행(색맹 안전).

---

## 6. 파생 데이터 (Selectors) — `src/store/selectors.ts`

원본 상태를 변형하지 않는 순수 함수. 화면은 저장된 값이 아니라 **계산된 값**을 읽는다.

| 함수 | 반환 | 용도 |
|---|---|---|
| `dayDiff(fromISO, toISO)` | number(일수) | 날짜 간 차이 |
| `dday(dateISO, today)` | number (0=D-DAY) | 약속 D-day 배지 |
| `recordsOn(records, dateISO)` | Record[] | 캘린더 아젠다·마커(채운 점) |
| `plansOn(plans, dateISO)` | Plan[] | 캘린더 아젠다·마커(빈 링) |
| `upcomingPlans(plans, today)` | Plan[] | 홈 히어로/약속 목록(미완료·미래, 임박순) |
| `weekStats(records, today)` | `{count, km, streak}` | 홈 "이번 주" StatCard |

- `weekStats.km`: 각 레코드 `fields.거리`("5.2km")를 `parseFloat` 합산 → 유산소만 자연 집계.
- `weekStats.streak`: `today`부터 하루씩 거슬러 올라가며 기록 있는 날 연속 카운트.
- **기준 날짜(`today`)는 스토어의 고정값** `'2026-06-30'`(디자인 레퍼런스). 실제 `Date`가 아니라
  seed와 일관되게 목업 상태를 재현하기 위함. 실서비스 전환 시 `today`만 실제 날짜로 교체.

---

## 7. MVP 단순화 (ponytail — 의도된 것)

| 단순화 | 지금 | 승격 지점 |
|---|---|---|
| 영속 계층 | AsyncStorage(JSON blob) | 건수↑ / 쿼리 필요 → SQLite (§4) |
| 조인 키 | `activity` 이름 문자열 | 동명이인·리네임 이슈 → `activityId` (§8) |
| `meta` | 비정규화 표시 문자열(저장 시 조립) | i18n·재계산 필요 → 렌더 시 `fields`로 조립 |
| 사용자 활동 아이콘 | 미저장(기본 아이콘 폴백) | 아이콘 키 enum 저장 |
| 동기화 | pending→synced 타이머 시뮬레이션 | 실제 백엔드 + 큐 + 충돌 해결 |
| `today` | 고정 `'2026-06-30'` | 실제 시스템 날짜 |
| 건강 연동 | placeholder("준비 중") | HealthKit / Health Connect |

---

## 8. 향후 마이그레이션 경로

1. **이름 → id 조인**: `Activity`에 `id` 추가, `Record.activity`/`Plan.activity` →
   `activityId`. 레지스트리 조회를 id 기준으로. (리네임·중복명 안전)
2. **스키마 버전업**: 저장 키 `logit.store.v1` → `v2`. rehydrate 시 구버전 감지 →
   변환 함수 적용 후 재저장. (`StoreContext`의 rehydrate 블록 한 곳만 수정)
3. **SQLite 전환**: `StoreContext`의 get/setItem을 SQLite 드라이버로 교체. 엔티티 타입
   (`types.ts`)·셀렉터·화면은 그대로 재사용.
4. **약속→기록 전환**: `completePlan`을 확장해 Plan을 소비하고 대응 Record를 생성.

---

## 9. 파일 맵

| 파일 | 역할 |
|---|---|
| `src/store/types.ts` | 엔티티 타입(`StoredRecord`, `StoredPlan`, `CustomActivity`, `StoreState`) |
| `src/store/seed.ts` | 초기(목업) 데이터 + 기준 날짜 `TODAY` |
| `src/store/StoreContext.tsx` | Context·영속·액션(`addRecord`/`addPlan`/`addActivity`/`completePlan`/`getRecord`)·`useSyncState` |
| `src/store/selectors.ts` | 순수 파생 함수(dday·weekStats·recordsOn…) |
| `src/data/activities.ts` | 빌트인 활동 카탈로그 + 템플릿/색/아이콘 해석 헬퍼 |
| `src/theme/tokens.ts` | `TemplateType`·`templateColor`·팔레트 |

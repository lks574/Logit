# MatchForm 스포츠별 스키마 — 설계

> 상태: 승인됨 (2026-07-02) · 관련: `src/screens/forms/MatchForm.tsx`, `src/data/activities.ts`, `src/store/types.ts`
> PROGRESS.md "선택 데이터 정합(잔여)"의 다음 후보.

## 목적

MatchForm의 종목별 기록을 **라벨 기반 임시 구조**(숫자 슬롯 2개 고정 + 정적 게임스코어)에서
**정식 필드 스키마**로 전환한다. 각 종목이 자신의 필드 목록(타입·개수 가변)을 데이터로 정의하고,
폼은 그 스키마에서 입력 UI를 생성한다.

## 현재 상태와 공백

- MatchForm에 인라인 `SPORTS` 레지스트리(6종목): 종목마다 숫자 슬롯 `[Slot, Slot]` 고정쌍 + `gameScore` 문자열.
- **공백 1**: `gameScore`가 정적 `<Text>`로만 표시되고 편집·저장 불가(라켓 종목 세트 스코어 기록 불가).
- **공백 2**: 슬롯이 항상 숫자 2개 고정 — 종목별 필드 개수·타입(숫자/텍스트) 차이를 반영 못 함.
- 데모 기본값(민준/지현·2:1·게임스코어 예시)이 레지스트리에 섞여 있음(생성은 빈 값 시작이라 불필요).

## 결정 사항

| 항목 | 결정 |
|---|---|
| 접근 | 정식 스키마 추출 (종목 정의를 데이터 모듈로 분리, 폼이 스키마 렌더) |
| 필드 타입 | `number`(number-pad 카드) · `text`(텍스트 입력행) 두 가지 (게임스코어는 text) |
| 게임스코어 | text 필드로 편집·저장 가능하게 |
| 기존 필드 키 | 보존(골/어시스트/안타/타점/에이스/더블폴트/최장 랠리/서브 득점/서브미션/스윕/스코어/결과/나/상대) |
| 데모 기본값 | 제거(생성 빈 값 시작 유지) |

## 아키텍처

### 1. 데이터 모듈 `src/data/sports.ts` (신규)

```ts
export type SportFieldType = 'number' | 'text';
export type SportField = {
  key: string;              // record.fields 키 (기존 라벨 보존)
  label: string;            // UI 라벨
  type: SportFieldType;
  placeholder?: string;
};
export type Sport = {
  key: string;
  label: string;
  icon: IconName;
  team?: boolean;           // team → 결과 승/무/패, 스코어 라벨 우리/상대
  meLabel: string;
  oppLabel: string;
  fields: SportField[];     // 종목별 핵심 기록 (숫자 슬롯 + 게임스코어 등)
};
export const SPORTS: Sport[];
export const ACTIVITY_TO_SPORT: Record<string, string>;
export function sportFor(key: string): Sport; // 미매칭 시 SPORTS[0]
```

MatchForm 인라인 `SPORTS`/`ACTIVITY_TO_SPORT`를 이 모듈로 이동. `Slot`/`gameScore`는 제거하고 `fields[]`로 통합.

### 2. 종목별 필드 정의

| 종목 | team | fields (key · type) |
|---|---|---|
| 배드민턴 | | 게임스코어(text, "21-18 · 19-21 · 21-15") · 최장 랠리(number) · 에이스(number) |
| 테니스 | | 게임스코어(text, "6-4 · 6-3") · 에이스(number) · 더블폴트(number) |
| 탁구 | | 게임스코어(text, "11-8 · 9-11 · 11-6") · 최장 랠리(number) · 서브 득점(number) |
| 축구 | ✓ | 골(number) · 어시스트(number) · 포지션(text, "미드필더") |
| 야구 | ✓ | 안타(number) · 타점(number) · 홈런(number) |
| 주짓수 | | 게임스코어(text, "어드밴티지 2-1") · 서브미션(number) · 스윕(number) |

### 3. MatchForm 렌더링 변경

- 종목 칩 선택 → `sport.fields`로 입력 UI 생성:
  - `number` 필드 → 기존 "종목별 핵심 기록" 숫자 카드(2열 그리드, number-pad).
  - `text` 필드 → 텍스트 입력행(게임스코어·포지션).
- 상태: `slotValues: Record<string,string>` → `fieldValues: Record<string,string>`(field.key 기준). edit 시 `record.fields[field.key]`로 프리필.
- 스코어 카드(나:상대)·결과 세그먼트는 공통 유지. `meName`/`oppName`은 계속 `나`/`상대` 키로 저장.
- 정적 게임스코어 카드 블록 제거(스키마 text 필드로 대체).
- footer 힌트 문구는 유지/소폭 조정.

### 4. 저장 / 검증 / 호환

- 저장: 값이 있는 필드만 `record.fields[key]`에 기록(기존 로직 일반화).
- 필수 검증: `meScore || oppScore || oppName || (sport.fields 중 하나라도 값 있음)` — 기존 의미 유지(슬롯 → 스키마 필드로 일반화).
- 기존 필드 키 보존 → 저장된 기록 edit 프리필 그대로 동작. seed엔 match 기록 없음(축구 약속만).
- `meta` 조립(상대 · 스코어 · 결과) 유지.

## 검증 (웹 프리뷰)

- 종목 전환 시 필드 UI가 스키마대로 스왑(숫자/텍스트 혼합).
- 게임스코어 입력 → 저장 → 상세/최근 기록 반영.
- 생성(빈 값 시작) → 상세 확인, 편집 진입 시 값 프리필.
- 필수 검증(전부 빈 값이면 저장 차단 안내).
- `tsc --noEmit` 클린, 콘솔 에러 없음.

## 범위 밖 (YAGNI)

- 사용자 정의 종목/필드 추가(커스터마이즈).
- 세트 스코어 전용 위젯(텍스트 입력으로 충분).
- 단위/형식 강제 검증.

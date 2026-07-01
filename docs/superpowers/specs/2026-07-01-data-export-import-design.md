# 데이터 내보내기 / 가져오기 — 설계

> 상태: 승인됨 (2026-07-01) · 다음 단계: 구현 계획(writing-plans)
> 관련: `docs/DATA_MODEL.md`, `docs/STORE.md`, `src/store/types.ts`, `src/store/StoreContext.tsx`

## 목적

기기 로컬(AsyncStorage `logit.store.v1`)에만 존재하는 데이터를 파일로 **내보내고**, 내보낸 JSON을 다시 **가져와 복원**한다. 실제 백엔드 동기화가 없는 현 상태에서 **수동 백업·기기 이전** 수단을 제공한다.

## 결정 사항 (브레인스토밍 확정)

| 항목 | 결정 |
|---|---|
| 범위 | 내보내기 + 가져오기 |
| 형식 | 내보내기: JSON + CSV / 가져오기: **JSON 전용** |
| 가져오기 병합 | **전체 교체** (확인 경고 후 현재 데이터 통째 덮어씀) |
| 사진 | **URI만** (v1). 바이너리 미포함 |
| 네이티브 전달 | `expo-sharing` 공유 시트 / `expo-document-picker` 파일 선택 |
| 웹 전달 | Blob 다운로드 / `<input type=file>` |

## 데이터 모델 (내보내기 대상)

`StoreState = { records, plans, customActivities, profile }` (`src/store/types.ts`). 전부 JSON 직렬화 가능. 사진은 `photos: string[]`(URI).

## 아키텍처

### 1. 새 모듈 `src/lib/dataTransfer.ts`

순수 직렬화 + 플랫폼별 IO를 한 곳에 캡슐화. `Platform.OS === 'web'` 분기.

- **`buildJSON(state: StoreState): string`**
  - 봉투(envelope): `{ app: 'logit', version: 1, exportedAt: <ISO>, data: state }`
  - `version`은 향후 마이그레이션용. pretty-print(들여쓰기 2).
- **`buildCSV(records: StoredRecord[]): string`**
  - 기록 전용(plans/profile/customActivities 제외 → CSV 재가져오기 불가 근거).
  - 코어 열: `dateISO, timeLabel, activity, template, rating, meta, memo, companions(’ · ’ join), photoCount`
  - 동적 열: 전체 record의 `fields` 키 합집합(정렬)을 열로 추가.
  - CSV 이스케이프: 값에 `,` `"` 개행 포함 시 `"`로 감싸고 내부 `"`는 `""`.
- **`exportData(state, format: 'json' | 'csv'): Promise<void>`**
  - 파일명: `logit-backup-YYYYMMDD.<json|csv>` (앱 런타임이므로 `new Date()` 사용 가능)
  - 네이티브: `expo-file-system` 새 API(`File`/`Paths.cache`)로 cache에 파일 write → `Sharing.shareAsync(uri, { mimeType, UTI })`.
    - mimeType: json=`application/json`, csv=`text/csv`.
  - 웹: `Blob` → `URL.createObjectURL` → 임시 `<a download>` 클릭 → revoke.
- **`importData(): Promise<StoreState | null>`**
  - JSON 전용. 취소 시 `null`.
  - 네이티브: `DocumentPicker.getDocumentAsync({ type: 'application/json' })` → 파일 텍스트 읽기.
  - 웹: 숨은 `<input type="file" accept="application/json">` → `FileReader`.
  - 파싱 후 **검증**: `parsed.app === 'logit'`, `typeof version === 'number' && version <= 1`, `Array.isArray(data.records)`, `Array.isArray(data.plans)`. 실패 시 `Alert` 후 `null`.
  - 누락 필드는 seed 병합과 동일하게 방어(예: `customActivities`/`profile` 없으면 기본값). 반환은 `{ ...정규화 }`.

### 2. 스토어 (`src/store/StoreContext.tsx`)

- 신규 액션 **`replaceAll(next: StoreState): void`** — `setState(next)`. 기존 persist effect가 AsyncStorage에 자동 저장.
- `StoreValue` 타입에 `replaceAll` 추가.

### 3. 설정 화면 (`src/screens/SettingsScreen.tsx` — "백업·동기화" 섹션)

- 기존 **데이터 내보내기** 행: `onPress` 연결 → `Alert`(iOS) / 선택 UI로 **JSON / CSV / 취소** 액션시트 → `exportData`.
- **데이터 가져오기** 행 **신설**: `onPress` → `importData()` → 성공 시 **"전체 교체" 경고 `Alert`**(현재 데이터가 대체됨) 확인 → `replaceAll(state)` → 완료 토스트/Alert.
- 정적으로 표시돼 있던 `value="CSV · JSON"`는 유지 또는 실제 동작에 맞게 조정.

## 데이터 흐름

```
[내보내기] Settings 행 → 형식 선택 → dataTransfer.exportData(state, fmt)
           → (native) 파일 write + Sharing / (web) Blob download

[가져오기] Settings 행 → dataTransfer.importData()
           → (native) DocumentPicker / (web) file input → parse+validate
           → 경고 확인 → store.replaceAll(state) → persist effect 저장
```

## 오류 처리

- 모든 IO는 `try/catch`. 실패 시 한국어 `Alert`("내보내기에 실패했습니다" 등).
- 사용자가 공유/선택기 취소 → no-op(에러 아님).
- 가져오기 검증 실패 → "올바른 Logit 백업 파일이 아닙니다" Alert, 데이터 변경 없음.

## 의존성

- 추가: `expo-sharing`, `expo-document-picker` (`npx expo install`로 SDK 57 호환 버전).
- 기존 활용: `expo-file-system`(새 File/Paths API, `src/lib/photos.ts`와 동일 패턴).
- 네이티브 모듈 추가이므로 dev 빌드 재-prebuild 필요(웹은 폴백으로 불필요).

## 검증

- **웹 프리뷰**(주 검증 루프):
  - JSON 내보내기 → 파일 다운로드 확인.
  - CSV 내보내기 → 다운로드 + 열 구조 확인.
  - 라운드트립: 내보내기 → 데이터 수정 → 같은 파일 가져오기 → "전체 교체" 후 원상 복원 확인.
  - 잘못된 파일 가져오기 → 검증 실패 Alert, 데이터 불변 확인.
- **네이티브**(dev 빌드 필요): 공유 시트/문서 선택기 동작 — 후속 검증으로 문서화.

## 한계 (문서화 필요)

- **사진**: URI만 내보냄 → 재설치/기기 이전 시 이미지 경로 깨짐(파일 미포함).
- **CSV**: 열람 전용, 재가져오기 불가(plans/profile/중첩 fields 손실).
- **병합 없음**: 가져오기는 전체 교체만. 부분 병합 미지원.

## 범위 밖 (YAGNI)

- 사진 바이너리 zip 번들.
- ID 기준 병합/충돌 해결.
- 자동/클라우드 백업(별도 백엔드 결정 필요 — PROGRESS.md #1).

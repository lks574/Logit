# Logit — 진행 상황 (핸드오프)

> 세션 재개용 인덱스. 상세는 아래 문서/코드/git 히스토리로 위임한다(중복 금지).
> 마지막 갱신: 2026-07-01

## 스냅샷
- **무엇**: `Downloads/design_handoff_logit_mobile/Logit.dc.html` 디자인을 재현한 개인 기록 앱(운동·공연).
- **스택**: Expo SDK 57 · React Native 0.86 · React 19 · TypeScript. React Navigation(native-stack + bottom-tabs), react-native-svg, AsyncStorage, expo-image-picker.
- **상태**: 전 화면 구현 + 오프라인 스토어 연동 완료. 웹 프리뷰 & iOS 시뮬레이터(Expo Go + dev 빌드) 실구동 검증 완료. `tsc --noEmit` 클린.

## 실행
```bash
npm install
npm start          # Metro (Expo Go / dev client 선택)
npm run ios        # 네이티브 dev 빌드(expo run:ios) → 독립 Logit.app, Expo Go 오버레이 없음
npm run web        # 브라우저 프리뷰(react-native-web) — 빠른 UI 확인용
```
- **웹 프리뷰**가 UI/인터랙션 확인에 가장 빠름(대부분 검증을 여기서 수행).
- **iOS 시뮬레이터 자동 조작**: `idb`(~/Library/Python/3.9/bin/idb) + companion 사용. 임시 드라이버는 세션마다 재작성했음(`/tmp/simdrive.py` — tap/tapxy/shot/labels). 스크린샷은 idb가 불안정해 `xcrun simctl io booted screenshot`로 대체.
- 네이티브 `ios/`·`android/`는 .gitignore(CNG로 재생성). Expo Go의 플로팅 dev-menu 기어가 우상단 버튼과 겹칠 수 있음 → dev 빌드엔 없음.

## 아키텍처 (상세 문서)
- `docs/FOUNDATION.md` — 디자인 토큰 / 공용 컴포넌트 / 네비게이션 계약.
- `docs/DATA_MODEL.md` — 엔티티(Record/Plan/Activity)·템플릿 유연스키마·영속·동기화·셀렉터·마이그레이션.
- `docs/STORE.md` — 스토어 사용 계약(액션/셀렉터/edit 모드).
- 코드 맵: `src/theme`(토큰·ThemeContext) · `src/components`(DS) · `src/store`(Context+AsyncStorage, seed, selectors, types) · `src/data/activities.ts`(활동 카탈로그) · `src/navigation` · `src/screens`(+`forms/`).

## 완료 (요약 — 세부는 `git log`)
- 화면 21종: 홈/빈상태, 활동선택, 기록폼 5종(Endurance/SetRep/Match/Spectate/Free), 상세(5 variant 통합), 통계/빈상태, 설정, 캘린더, 약속목록/추가, 활동추가, 추가-선택시트.
- **오프라인 우선 스토어**: 생성/수정/삭제/영속, sync pending→synced, 최근7일 주간집계.
- **기록**: 생성(폼 저장)·수정(recordId 프리필+update)·삭제·상세 실데이터/사진 렌더. 신규 폼은 **빈 값 시작**, 수정은 실제 값 프리필.
- **약속**: 생성·수정(우상단 저장/삭제)·삭제·**약속→기록 전환**(체크 시 Detail 이동). 날짜(인라인 달력)·시간(오전/오후·시·분) 편집.
- **캘린더**: 월 좌우 이동/오늘, 마커(했던 것 점/약속한 것 링), 선택일 아젠다, "이 날 약속 추가".
- **통계/회고**: 실데이터 집계(연속·누적·월별 거리 차트·평균 페이스Δ·최장 거리·공연 최다 관람/배우), 필터(전체/유산소/근력/공연).
- **사진**: 세부 입력에서 **촬영/앨범 선택** 액션시트(`src/lib/photos.ts`), 권한 문구는 app.json 플러그인.
- **테마**: light/dark/system 3-way(설정에서 실연동). 설정 세그먼트 레이아웃 수정.
- **추가 진입**: FAB → 기록/약속 선택 시트(AddChooser).

## 미완 / 알려진 한계 (다음 후보)
- **백엔드 동기화**: 현재 pending→synced는 타이머 시뮬레이션. 실제 동기화 큐/충돌해결 없음.
- **HealthKit / Health Connect**: 설정·폼에 "준비 중" placeholder만. 네이티브 연동 미구현(dev 빌드 필요).
- **카메라 촬영**: 옵션·권한 배선 완료했으나 시뮬레이터엔 카메라가 없어 실물/기기 확인 필요.
- **android `RECORD_AUDIO` 권한**: expo-image-picker(동영상) 기본값. 이미지 전용이라 불필요 시 제거 가능.
- **선택 데이터 정합**: 새 기록 폼의 template별 핵심 필드는 자유 입력(검증/단위 강제 없음). MatchForm 점수/슬롯은 편집 가능하나 스포츠별 스키마는 라벨 기반.
- 미검증 잔여 화면(기기): SetRep/Spectate/Free 폼 빈 상태·AddActivity·StatsEmpty·HomeEmpty·Detail(축구/야구/뮤지컬/연극)은 웹에서만 확인.

## 검증 상태
- `tsc --noEmit`: 클린. 콘솔 에러: 없음.
- 웹 프리뷰: 전 화면 + 주요 플로우 확인.
- iOS 시뮬레이터: Home/Stats/Calendar/Plans/Detail/AddPlan/EnduranceForm 생성·수정·전환·삭제, 날짜/시간 피커, 사진 선택+카메라 옵션, 테마 토글 — 실구동 확인. dev 빌드 Build Succeeded.

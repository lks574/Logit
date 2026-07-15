# Logit — 진행 상황 (핸드오프)

> 세션 재개용 인덱스. 상세는 아래 문서/코드/git 히스토리로 위임한다(중복 금지).
> 마지막 갱신: 2026-07-14

## 스냅샷
- **무엇**: `Downloads/design_handoff_logit_mobile/Logit.dc.html` 디자인을 재현한 개인 기록 앱(운동·공연).
- **스택**: Expo SDK 57 · React Native 0.86 · React 19 · TypeScript. React Navigation(native-stack + bottom-tabs), react-native-svg, AsyncStorage, expo-image-picker.
- **상태**: 전 화면 구현 + 오프라인 스토어 연동 완료. Firebase(인증·Firestore·Remote Config) 연동, 실기기 dev 빌드 실구동 검증. `tsc --noEmit` 클린.

## 실행
```bash
npm install
npm start          # Metro (Expo Go / dev client 선택)
npm run ios        # 네이티브 dev 빌드(expo run:ios) → 독립 Logit.app, Expo Go 오버레이 없음
npm run web        # 브라우저 프리뷰(react-native-web) — 빠른 UI 확인용
npm run tunnel     # 실기기 원격 접속: Cloudflare 터널 + Metro 한 방(ngrok 차단망 우회). cloudflared 필요
```
- **웹 프리뷰**가 UI/인터랙션 확인에 가장 빠름(대부분 검증을 여기서 수행).
- **iOS 시뮬레이터 자동 조작**: `idb`(~/Library/Python/3.9/bin/idb) + companion 사용. 임시 드라이버는 세션마다 재작성했음(`/tmp/simdrive.py` — tap/tapxy/shot/labels). 스크린샷은 idb가 불안정해 `xcrun simctl io booted screenshot`로 대체.
- 네이티브 `ios/`·`android/`는 .gitignore(CNG로 재생성). Expo Go의 플로팅 dev-menu 기어가 우상단 버튼과 겹칠 수 있음 → dev 빌드엔 없음.
- **실기기/원격 테스트**: `docs/DEVICE_TESTING.md` 참조(Expo Go 불가·dev 빌드·서명·터널·Release).

## 아키텍처 (상세 문서)
- `docs/FOUNDATION.md` — 디자인 토큰 / 공용 컴포넌트 / 네비게이션 계약.
- `docs/DATA_MODEL.md` — 엔티티(Record/Plan/Activity)·템플릿 유연스키마·영속·동기화·셀렉터·마이그레이션.
- `docs/STORE.md` — 스토어 사용 계약(액션/셀렉터/edit 모드).
- 코드 맵: `src/theme`(토큰·ThemeContext) · `src/components`(DS) · `src/store`(Context+AsyncStorage, seed, selectors, types) · `src/data`(activities·sports 카탈로그) · `src/navigation` · `src/screens`(탭별 폴더: `home/`·`calendar/`·`add/`(+`forms/`)·`stats/`·`settings/`·`shared/`).

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
- **회원(로컬 프로필)**: ProfileEdit(이름·이메일 편집). 스토어 `profile`에 저장·영속, 아바타 이니셜은 이름에서 파생. (진입점은 이후 '마이' 탭으로 이동, 인증은 아래 2026-07 세션 참고.)
- **필수 필드 검증**: 5개 폼 모두 `handleSave`에서 빈 저장 차단 + Alert(Endurance=거리|시간, SetRep=부위|총볼륨|세트, Match=스코어|상대|슬롯, Spectate=작품명, Free=시간|메모).
- **데이터 내보내기/가져오기**: 설정 "백업·동기화"에서 내보내기(JSON 전체 백업·CSV 기록표)·가져오기(JSON 전용, 전체 교체). `src/lib/dataTransfer.ts`(웹=Blob/file input, 네이티브=expo-sharing/document-picker) + `src/components/ActionSheet.tsx`(RNW Alert no-op 대응 크로스플랫폼 시트) + 스토어 `replaceAll`. 웹 프리뷰 라운드트립·검증실패 확인. 설계: `docs/superpowers/specs/2026-07-01-data-export-import-design.md`.
- **정리**: 불필요한 android `RECORD_AUDIO` 권한 제거(이미지 전용, `microphonePermission:false`).
- **MatchForm 스포츠별 스키마**: 종목 정의를 `src/data/sports.ts`로 분리(종목별 `fields[]` 스키마: number/text). MatchForm이 스키마로 입력 UI 생성, 게임스코어가 편집·저장 가능(기존 정적 표시 해결), 축구 포지션·야구 홈런 등 추가. 저장 키 보존. 설계: `docs/superpowers/specs/2026-07-02-matchform-sport-schema-design.md`.

### 2026-07 세션 (인증·Firebase·링크·원격설정 — 세부 `git log`)
- **인증(Firebase)**: 이메일 로그인/가입/재설정/이메일인증 5화면 + 게이팅(미인증→VerifyEmail). `src/auth`. 계정↔로컬 프로필 동기화(App `AuthProfileSync`).
- **설정/마이 분리**: 하단탭 '마이'(프로필·내 데이터·계정·지원소식) + 우상단 기어→'설정'(테마·언어·약관·버전). **개발 현황**·**개발자 피드백**(Firestore `feedback`) 화면 추가.
- **약속→기록 전환**: 홈·약속목록·캘린더 체크 → 기록 추가 화면을 약속 데이터로 프리필 → 저장 시 기록 생성 + 약속 완료(빈 기록 자동생성 폐기).
- **알림**: `expo-notifications` 로컬 알림(약속 시작 1시간 전) 예약/취소를 스토어 액션에 연동 + Expo push 토큰 등록. `src/lib/notifications.ts`·`push.ts`.
- **딥링크/유니버설·앱링크**: React Navigation `linking`(스킴 `logit://` 즉시 동작). 유니버설(iOS)·앱링크(Android)는 Firebase Hosting에 AASA/assetlinks 배포·설정 완료. `src/navigation/linking.ts`.
- **Remote Config(@react-native-firebase)**: 개발현황(`dev_status`)·버전게이트(`version_gate`) 원격 갱신, 정적 폴백 유지. `src/lib/remoteConfig.ts` (GoogleService-Info.plist 필요).
- **버전 게이트**: 강제(현재<minSupported: 알럿+차단화면, 복귀 시 재노출)/선택(<latest: 안내모달) 업데이트 + 설정 버전행 최신·업데이트 유도. `src/components/UpdateGate.tsx`·`src/lib/version.ts`.
- **동기화 실값**: 홈 배지·마이가 **클라우드 백업 서명** 기준(백업 후 수정→"동기화 안됨"). 배지 탭→마이. 스토어 `backupSignature`/`markBackedUp`.
- **러닝 지표**: 평균 페이스 → **평균 속도(km/h)**, **칼로리 자동계산(ACSM, 체중 기반)** — 프로필 `weightKg`.
- **통계 활동별**: 템플릿 섹션 제거, 최신 기록순 단일 그리드.
- **±스텝퍼 롱프레스**: 평점·시간 연속 변경(`useHoldRepeat`), 분 1분 단위.
- **지난 기록 프리필 전 폼 확산**(ROADMAP P1): "최근 {활동} 기록 불러오기" 배너를 `src/components/PrefillBanner.tsx`로 추출, 6개 폼 전체 적용(폼별 복사 필드는 `docs/ROADMAP.md` §P1 표). 결과성 값(스코어·좌석·기간 등)은 복사 제외.
- **근력(SetRep) 다종목 로거 고도화**: 기존엔 종목명이 "벤치프레스"로 하드코딩 + "종목 추가" 버튼이 죽어 있어 한 기록에 종목 1개만 가능했음. → 여러 종목(이름+세트[]) 지원. `src/lib/strength.ts`(파싱·볼륨·정리 + 레거시 `fields.세트`→1종목 마이그레이션), 저장은 `fields.운동`(JSON). 종목/세트 추가·삭제, **세트 추가 시 직전 세트 무게·반복 복사**(입력 최소화), 총 볼륨 전 종목 합산. DetailScreen에 종목·세트 breakdown 렌더(JSON 누출 방지). 웹 검증: 2종목 입력·볼륨 1464kg·Detail 렌더 확인.
- **Spectate 디테일 관람 카드 + Detail→통계 링크**: (C) 공연 상세 상단에 〈작품〉 + "N번째 관람" 배지(같은 작품 누적 관람 순번, 2회↑ 노출) + 출연진 칩(이름 해시 색상). 작품/출연진/회차는 표에서 제외. (D) 모든 상세 하단에 "{활동} 통계 보기 · 기록 N개" 링크 → 활동별 `CategoryStats`(기록 2개↑일 때만). `src/screens/shared/DetailScreen.tsx`. 웹 검증: 레미제라블 2번째 관람 카드·출연진 칩·헬스/뮤지컬 통계 링크 이동 확인.
- **Match 디테일 스코어보드**: 경기 상세를 밋밋한 표에서 벗어나게 — 상단에 결과 배지(승=success/무=warning/패=error) + 큰 `나 3 : 1 상대`(팀·상대 이름 표기). 스코어/결과/나/상대는 표에서 제외, 종목별 슬롯(골·포지션 등)만 표에 남김. 스코어 없이 이름만 있으면 'A vs B' 폴백. `src/screens/shared/DetailScreen.tsx`. 웹 검증: 축구 3:1 승 스코어보드 렌더 확인.
- **최근 장소 칩 실데이터화**: Endurance·SetRep 폼의 하드코딩 장소 칩("올림픽공원/양재천" 목업) → 과거 기록의 `fields.장소`에서 추출한 실제 최근 장소. 공용 `src/lib/history.ts`의 `recentValues(records, key)`로 통합(Spectate `pastVenues`·Camping 재방문과 동일 계열). 값 없으면 칩 미노출. 웹 검증: 저장→새 폼에서 실제 장소 칩 등장.
- **근력 폼 점진적 공개(progressive disclosure) + 최근 종목 칩**: 1단계(기본 노출)=운동 시간(분 단위 숫자)+부위 **다중 선택**('가슴·삼두'로 저장, 레거시 단일값 호환) — 이것만으로 저장 가능. 2·3단계="종목 기록·선택" 접힌 섹션(종목 저장된 기록을 열면 자동 펼침). 섹션 안 **"최근 종목" 칩** = 과거 기록에서 자동 추출(`recentExercises`, 최근 사용순 8개, 관리 화면 없는 라이브러리) — 탭하면 **마지막 세트 구성째로 프리필**. meta는 깊이 적응(시간만→'가슴 · 45분', 종목까지→'2종목 · 볼륨 1464kg'). 웹 검증: 칩 프리필·다중 부위·45분 저장·Detail 확인.

## 미완 / 알려진 한계 (다음 후보)
- **다음 작업 우선순위**: `docs/ROADMAP.md` — 리텐션 우선 실행 스펙. P1(프리필)·P2(공유 카드) 완료, **P4(PostHog 계측)는 제외(도입 안 함, revert)**, 남은 건 P3 HealthKit(실기기·dev 빌드 필요). 착수 시 이 문서부터.
- **공유 카드(P2)**: DetailScreen 헤더 공유 버튼 → `ShareCard`(4:5 라이트 카드) 캡처 → OS 공유 시트. `react-native-view-shot`+`shareCard.ts`(웹 no-op). 실제 캡처·공유는 **네이티브 전용**(iOS 시뮬레이터/실기기 최종 확인 남음).
- **원격 push 발송**: 클라이언트 토큰 등록까지만. EAS projectId·APNs 키·발송 서버(Cloud Function) 미구성.
- **유니버설/앱링크 미완**: iOS는 **유료 Apple Developer 계정** 필요(Associated Domains 프로비저닝) — 현재 스킴 딥링크만 동작. Android 앱링크는 `public/.well-known/assetlinks.json`의 SHA-256 미기입(Android 빌드 전).
- **STORE_URL 플레이스홀더**: `src/lib/version.ts` 스토어 URL이 미등록 앱이라 placeholder(iOS `id0000000000`) — 스토어 등록 후 교체해야 업데이트 버튼 이동.
- **동기화 범위**: 클라우드 백업 기준 감지. 클라우드 복원 직후엔 "동기화 안됨"으로 표시(백업 누르면 해소) — 안전 우선. 실시간 자동 동기화·충돌해결 없음.
- **HealthKit / Health Connect**: 설정·폼에 "준비 중" placeholder만. 네이티브 연동 미구현(dev 빌드 필요).
- **카메라 촬영**: 옵션·권한 배선 완료했으나 시뮬레이터엔 카메라가 없어 실물/기기 확인 필요.
- **데이터 이식 한계**: 내보내기 사진은 URI만(재설치/기기이전 시 이미지 깨짐). CSV는 열람 전용(재가져오기 불가). 가져오기는 전체 교체만(부분 병합 없음).
- **선택 데이터 정합(잔여)**: 필수 검증·MatchForm 스포츠별 스키마 완료. 단위/형식 강제는 여전히 없음(자유 입력 "5.2km"/"27:12" 유지). 참고: 진입 활동명(`activity`)과 종목 칩(`sportKey`)은 분리 — 칩을 바꿔 저장하면 activity는 진입값 그대로(기존 설계 특성).
- 미검증 잔여 화면(기기): SetRep/Spectate/Free 폼 빈 상태·AddActivity·StatsEmpty·HomeEmpty·Detail(축구/야구/뮤지컬/연극)은 웹에서만 확인.

## 검증 상태
- `tsc --noEmit`: 클린. 콘솔 에러: 없음.
- 웹 프리뷰: 전 화면 + 주요 플로우 확인.
- iOS 시뮬레이터: Home/Stats/Calendar/Plans/Detail/AddPlan/EnduranceForm 생성·수정·전환·삭제, 날짜/시간 피커, 사진 선택+카메라 옵션, 테마 토글 — 실구동 확인. dev 빌드 Build Succeeded.

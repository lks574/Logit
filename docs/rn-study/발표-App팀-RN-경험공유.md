# App팀 발표 — React Native 실험 경험 공유

> 한 줄 요약: 같은 회사 앱을 두 방향으로 RN 실험 — **밑바닥부터 새 앱(Logit)** vs **기존 네이티브 앱에 한 화면만 이식(Flitto 이미지수집)**. 둘의 경험이 완전히 달랐고, 그 차이가 곧 "우리가 RN을 어떻게 써야 하나"에 대한 답이다.

발표일: 2026-07-08 · 발표자: 이경석

---

## 0. 발표 흐름 (3분 버전)

1. AI로 RN 구현을 실제로 돌려봤다 (말이 아니라 코드로)
2. 두 개의 실험 — greenfield / brownfield
3. 뭐가 달랐나 — 속도는 greenfield, 고통은 brownfield
4. 장단점 요약
5. 팀 제언 — 언제 쓰고 언제 쓰지 말까

---

## 1. 배경 — 왜 RN을 봤나

- iOS/AOS 두 벌 유지 비용. 한 벌로 줄일 수 있나?
- AI(Claude Code)로 **실제 구현까지** 돌려봄. 슬라이드가 아니라 빌드·실기기 실행으로 검증.
- 두 가지 진입 방식을 각각 끝까지 밀어봄:
  - **[[Greenfield]]**: 신규 앱 전체를 RN으로 — **Logit**
  - **[[Brownfield]]**: 기존 네이티브 앱에 RN 화면 하나만 — **Flitto 아케이드 이미지수집**

---

## 2. 두 개의 실험

### A. Logit — greenfield (밑바닥부터 RN)

| 항목 | 내용 |
|---|---|
| 스택 | Expo SDK 57 + RN 0.86 + React 19 ([[New Architecture]] 기본) |
| 성격 | 개인 기록 앱. 디자인 문서(01~08) 기준으로 화면 21종 이식 |
| 네비게이션 | [[React Navigation]] (탭 + 모달 스택) |
| 상태 | 로컬 상태만 (동기화/DB는 의도적 미구현) |
| 결과 | **iOS/Android/Web 3플랫폼 한 코드베이스**. 디자인 시스템·화면 빠르게 이식됨 |

**핵심 경험**: [[Expo Go]]/[[Dev Client]]로 세팅이 거의 없다. `npm install → npm run ios`. [[Fast Refresh]]로 저장 즉시 반영. 네이티브 빌드를 거의 안 건드림. → **"이래서 RN 쓰는구나"를 체감한 쪽.**

### B. Flitto 이미지수집 — brownfield (기존 앱에 이식)

| 항목 | 내용 |
|---|---|
| 스택 | RN 0.83 / React 19, Rock 기반 패키징 |
| 성격 | 아케이드 이미지수집 5화면을 RN으로 포팅, 네이티브 Flitto 앱에 **피처 플래그로 병행 임베드** |
| 통합 방식 | RN을 **xcframework 5개**로 빌드 → SPM `binaryTarget`으로 링크 |
| 진입 | 아케이드 리스트 카드 탭 → `RNImageScrapHostViewController`가 RN 뷰 렌더 |
| 결과 | 실기기까지 렌더/API 연동/화면 이동 확인. 단 **여기 오기까지가 전쟁** |

**핵심 경험**: 기능 구현(JS)은 빨랐지만, **기존 앱에 "끼워넣는" 툴체인에서 계속 막힘.** 아래 함정 참고.

---

## 3. 실제 함정 (brownfield에서 겪은 것)

> 이게 발표의 진짜 알맹이 — "RN 쉽다"의 반례.

1. **Tuist 4 + SPM인데 CocoaPods를 안 씀** → RN을 넣으려면 바이너리(xcframework)가 필요. 그런데 대부분의 RN brownfield 패키저가 **CocoaPods 직접 통합을 요구** → 우리 빌드 시스템과 정면충돌.
2. **[[New Architecture]] codegen이 brownfield 라이브러리와 깨짐** — 처음엔 `newArchEnabled: false`로 우회, 최종적으로 Expo를 버리고 **Rock(RN 0.83)** 으로 re-platform.
3. **xcframework 5개가 비면 → SPM 그래프 전체가 fatalError** → 엉뚱하게 "Firebase 없음" 에러로 위장됨. 클린 체크아웃마다 재현되는 3대 함정.
4. **실기기 디버그는 `localhost:8081` 못 붙어 크래시** → Metro 호스트를 실제 IP로 잡거나 내장 번들 폴백 분기 필요.
5. 로케일(`LANG`)이 비면 pod install이 UTF-8 에러로 죽음 — 호스트 앱은 CocoaPods 미사용이지만, **Rock이 xcframework를 만드는 패키징 단계 내부**에선 pod을 씀. 이런 자잘한 지뢰가 계속.

→ **교훈: brownfield의 어려움은 RN 자체가 아니라 "네이티브 빌드 시스템과의 결합"에 있다.**

동시에 잘 된 것: 화면 픽셀 1:1 복제, API 연동, SafeArea까지 실기기 확인 완료. 그리고 아래 개발 루프.

### 3.5 그래서 평소 개발 루프는? — "JS는 어디에 있나"

**WebView에 비유하면 전부 설명된다** (네이티브 개발자용 멘탈모델):

- RN 화면 = WebView와 비슷하게 "렌더러 + 콘텐츠(JS)" 구조. xcframework에는 **① 렌더러(React/Hermes 런타임) + ② 콘텐츠(JS 번들)** 둘 다 구워져 들어간다 (`npm run package:ios` 시점).
- **Metro는 앱에 링크되는 라이브러리가 아니라, Mac에서 도는 개발용 HTTP 서버(프로세스)**다. `npm start`로 켜둔다.

|                          | WebView로 치면                                                     | JS 수정 반영                                                 |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------------------------- |
| **B. 내장 번들** (현재)        | `webView.load(로컬 .html 파일)` — 파일을 앱에 구워 넣음                      | ❌ `.tsx` 고쳐도 앱엔 옛 번들 그대로. 재패키징 → xcframework 재복사 → 앱 재빌드 |
| **A. Metro 라이브** (개발 권장) | `webView.load("http://192.168.100.28:8081")` — Mac의 dev 서버를 바라봄 | ✅ 저장하면 Metro가 새 번들을 내주고 앱이 리로드. **재빌드 0**                |

A 모드 조건: `RNMetroHost`=Mac IP + 같은 WiFi + Debug 빌드. 호스트 코드(`RNImageScrapHostViewController`)가 Debug에서만 이 override를 허용한다.

> [!warning] 시연 체크
> 현재는 **B 모드** (`Project/Flitto/Project.swift:208` → `RNMetroHost: "localhost"`, 실기기에선 무의미 → 내장 번들 폴백). 서버 없이 시연 가능하지만 **JS 고쳐도 반영 안 됨**. A 모드 전환은 한 줄:
> ```swift
> // Project/Flitto/Project.swift:208
> ["RNMetroHost": "192.168.100.28"]   // Mac LAN IP (en0)
> ```
> → `tuist generate` → Debug 실기기 빌드 → `npm start` 켜두면 핫리로드.

→ **발표 포인트: 네이티브라면 한 글자 고쳐도 재빌드. brownfield RN도 A 모드면 JS 수정 → 저장 → 즉시 반영.** 이게 통합 비용을 감수하고 얻는 실질 보상.

---

## 4. 비교 — greenfield vs brownfield

> **먼저, 축이 두 개다.** 이 표만 보면 "greenfield=Expo=무조건 승"으로 읽히는데, 착시다.
> - **greenfield ↔ brownfield**: 새 앱이냐, 기존 앱에 이식이냐 — **상황이 정한다.** Flitto는 라이브 제품이라 greenfield가 애초에 불가능.
> - **Expo ↔ bare**: 어떤 도구로 빌드하냐 — **선택이다.** greenfield면 무조건 Expo. bare는 "더 나아서"가 아니라 **Expo가 못 하는 조건**(기존 앱 임베드, 빌드 시스템 충돌)에서 떨어지는 곳. 우리도 Expo를 먼저 시도했고, 막혀서 bare(Rock)로 내려온 것.

| 관점 | Logit (greenfield) | Flitto 임베드 (brownfield) |
|---|---|---|
| 세팅 난이도 | 낮음 (Expo가 다 해줌) | **매우 높음** (툴체인 결합) |
| 첫 화면까지 시간 | 몇 분 | 몇 주 (탐색·막다른 길 포함, 재현 시 단축) |
| 기존 자산 재사용 | 없음 (새 앱) | 로그인/네비/토큰 등 네이티브 자산 그대로 |
| 크로스플랫폼 이득 | **최대** (iOS/AOS/Web) | 부분적 (한 화면만) |
| 유지보수 주체 | RN 단일 | 네이티브 + RN **둘 다** 알아야 함 |
| 리스크 | 네이티브 심화 기능 만나면 벽 | 결합부가 계속 깨질 수 있음 |
| AI 생산성 | 매우 높음 | 높음(구현) but 툴체인은 사람이 뚫음 |

관련: [[04-프로젝트-유형/02-그린필드-vs-브라운필드]] · [[04-프로젝트-유형/03-의사결정-매트릭스]]

---

## 5. 장단점 (팀 관점)

### 장점
- **한 코드베이스로 iOS/AOS(+Web)** — 신규 앱이면 인력·일정 절반급.
- **Fast Refresh / OTA([[OTA Update]])** — 반복 속도, 네이티브 심사 없이 JS 패치.
- **AI 친화적** — 화면/로직 구현 생산성이 특히 높음.
- 네이티브 개발자에게 유리 — 막히는 지점(성능/네이티브 모듈)에서 우리가 강함.

### 단점 / 리스크
- **brownfield 통합 비용이 크다** — 특히 우리처럼 Tuist·SPM·CocoaPods 미사용 조합.
- 버전 업그레이드 민감 — RN/Expo/New Arch 조합에서 라이브러리가 깨짐.
- 네이티브를 몰라도 되는 게 아니라 **네이티브 + JS 둘 다** 필요(brownfield).
- 성능 심화·플랫폼 고유 기능은 결국 네이티브로 내려가야 함.

---

## 6. 팀 제언 (결론)

- **신규 독립 앱 / 사내툴 / 빠른 검증** → greenfield RN, 강하게 추천. Logit이 증거.
- **기존 Flitto 앱에 부분 도입** → 가능하지만 **통합 비용을 반드시 선반영**. 화면 1~2개 실험은 OK, 전면 이식은 신중.
- 도입한다면: New Architecture / 라이브러리 호환성 매트릭스를 **먼저 검증**하고 버전 고정.
- AI로 구현 자체는 빠르니, **판단 포인트는 "구현"이 아니라 "통합·유지보수 비용"**.

---

## 7. 관련 노트
[[README]] · [[Greenfield]] · [[Brownfield]] · [[04-프로젝트-유형/01-Expo-vs-Bare]] · [[04-프로젝트-유형/03-의사결정-매트릭스]] · [[99-실습-프로젝트/네이티브-개발자의-함정]] · [[New Architecture]] · [[OTA Update]]

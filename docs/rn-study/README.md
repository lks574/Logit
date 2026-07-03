# RN Study — 네이티브 개발자를 위한 React Native 커리큘럼

> iOS/AOS 개발자 관점에서 React Native를 체계적으로 학습하기 위한 옵시디언 vault.
> 실습 코드베이스: 이 레포(Logit, Expo SDK 57). Expo 관련 내용은 반드시 https://docs.expo.dev/versions/v57.0.0/ 기준으로 확인.

## 학습 순서

- **Phase 0→1→2는 순서대로.** JS 멘탈모델 없이 RN을 만지면 계속 미끄러진다.
- **Phase 3~7은 레퍼런스.** 필요할 때 찾아 읽는다. 전부 순서대로 읽으면 지친다.
- 새 용어를 만나면 `00-용어집/`에서 찾고, 없으면 노트를 만든다.
- 노트 작성 규칙은 [템플릿](템플릿.md) 참고.

## 목차 (MOC)

### 00. 용어집
용어 1개 = 노트 1개. `00-용어집/` 폴더. 본문에서 `[[용어]]`로 링크.

- 엔진/아키텍처: [[Hermes]] · [[JSI]] · [[Bridge]] · [[Bridgeless]] · [[Fabric]] · [[Turbo Module]] · [[Codegen]] · [[Shadow Tree]] · [[Yoga]] · [[New Architecture]]
- 빌드/도구: [[Metro]] · [[Bundle]] · [[Fast Refresh]] · [[Autolinking]] · [[Prebuild]] · [[CNG]] · [[Config Plugin]] · [[Dev Client]] · [[Expo Go]] · [[EAS]] · [[OTA Update]]
- React: [[JSX]] · [[Hook]] · [[Props]] · [[State]] · [[Re-render]] · [[Reconciliation]] · [[Stale Closure]] · [[Memoization]]
- 생태계: [[Expo Router]] · [[React Navigation]] · [[Reanimated]] · [[Worklet]] · [[FlatList]] · [[Expo Modules API]] · [[Monorepo]] · [[Managed Workflow]] · [[Bare Workflow]] · [[Greenfield]] · [[Brownfield]]

### 01. JS/TS 기초 — 네이티브 개발자가 제일 먼저 막히는 곳
1. [이벤트 루프와 싱글 스레드](01-JS-TS-기초/01-이벤트루프와-싱글스레드.md)
2. [Promise와 async/await](01-JS-TS-기초/02-Promise와-async-await.md)
3. [클로저와 스코프](01-JS-TS-기초/03-클로저와-스코프.md)
4. [모듈 시스템](01-JS-TS-기초/04-모듈-시스템.md)
5. [TypeScript 핵심](01-JS-TS-기초/05-TypeScript-핵심.md)
6. [패키지 매니저와 node_modules](01-JS-TS-기초/06-패키지-매니저와-node_modules.md)

### 02. RN 동작 방식 — 디바이스에서 앱이 뜨기까지
1. [앱 실행 시퀀스](02-RN-동작방식/01-앱-실행-시퀀스.md)
2. [스레드 모델](02-RN-동작방식/02-스레드-모델.md)
3. [구 아키텍처 — Bridge](02-RN-동작방식/03-구아키텍처-Bridge.md)
4. [신 아키텍처 — JSI·Fabric·Turbo Modules](02-RN-동작방식/04-신아키텍처-JSI-Fabric-TurboModules.md)
5. [Metro·Hermes·Yoga](02-RN-동작방식/05-Metro와-Hermes와-Yoga.md)

### 03. 핵심 개발
1. [컴포넌트와 JSX](03-핵심-개발/01-컴포넌트와-JSX.md)
2. [상태와 렌더링](03-핵심-개발/02-상태와-렌더링.md)
3. [스타일링과 Flexbox](03-핵심-개발/03-스타일링과-Flexbox.md)
4. [리스트 — FlatList와 FlashList](03-핵심-개발/04-리스트-FlatList-FlashList.md)
5. [내비게이션](03-핵심-개발/05-내비게이션.md)
6. [상태 관리](03-핵심-개발/06-상태관리.md)
7. [애니메이션 — Reanimated](03-핵심-개발/07-애니메이션-Reanimated.md)
8. [제스처](03-핵심-개발/08-제스처.md)
9. [플랫폼 분기](03-핵심-개발/09-플랫폼-분기.md)

### 04. 프로젝트 유형 — Expo/Bare × 그린필드/브라운필드
1. [Expo vs Bare](04-프로젝트-유형/01-Expo-vs-Bare.md)
2. [그린필드 vs 브라운필드](04-프로젝트-유형/02-그린필드-vs-브라운필드.md)
3. [의사결정 매트릭스](04-프로젝트-유형/03-의사결정-매트릭스.md)

### 05. 네이티브 연동 — 네이티브 개발자의 무기
1. [Turbo Native Module 작성](05-네이티브-연동/01-Turbo-Native-Module-작성.md)
2. [Fabric Native Component](05-네이티브-연동/02-Fabric-Native-Component.md)
3. [Expo Modules API](05-네이티브-연동/03-Expo-Modules-API.md)
4. [Autolinking과 라이브러리 평가](05-네이티브-연동/04-Autolinking과-라이브러리-평가.md)

### 06. 규모별 케이스
1. [간단한 앱 — 1인 빠른 출시](06-규모별-케이스/01-간단한-앱.md)
2. [복잡한 앱](06-규모별-케이스/02-복잡한-앱.md)
3. [팀 협업](06-규모별-케이스/03-팀-협업.md)

### 07. 프로덕션
1. [릴리즈 파이프라인](07-프로덕션/01-릴리즈-파이프라인.md)
2. [버전 업그레이드 전략](07-프로덕션/02-버전-업그레이드-전략.md)
3. [디버깅과 프로파일링](07-프로덕션/03-디버깅과-프로파일링.md)
4. [보안과 접근성](07-프로덕션/04-보안과-접근성.md)

### 08. Claude Code 활용
1. [Claude Code RN 워크플로](08-Claude-Code-활용/01-Claude-Code-RN-워크플로.md)

### 99. 실습
- [실습 프로젝트 — Logit 기반](99-실습-프로젝트/README.md)
- [네이티브 개발자의 함정](99-실습-프로젝트/네이티브-개발자의-함정.md) — 학습하며 계속 추가하는 살아있는 노트

## 검증 원칙

- 이 vault의 내용은 **RN 0.76+ (New Architecture 기본) / Expo SDK 57** 기준.
- 버전에 민감한 내용(설정 파일, CLI 명령, API)은 노트에 기준 버전을 명시한다.
- 확실하지 않은 내용은 적지 않는다. "버전에 따라 다름 — 공식 문서 확인"으로 남긴다.
- 참고 원천: reactnative.dev 공식 문서, docs.expo.dev (버전 고정 URL), 각 라이브러리 공식 문서.

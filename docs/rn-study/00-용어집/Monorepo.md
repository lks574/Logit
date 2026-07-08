# Monorepo

> [!abstract] 한 줄 정의
> 여러 패키지(앱, 공용 라이브러리, 디자인 시스템 등)를 **하나의 git 저장소**에서 함께 버전 관리·빌드하는 구조. JS 생태계에서는 패키지 매니저의 workspaces 기능으로 구현한다.

> [!info] iOS/AOS로 치면
> 한 Xcode 워크스페이스에 앱 타겟 + 로컬 Swift Package들을 두는 구조, 또는 하나의 Gradle 프로젝트에 `:app`, `:core`, `:feature-*` 모듈을 두는 멀티모듈 구성. "공용 코드를 별도 배포 없이 소스로 참조한다"는 목적이 같다.

## 📖 설명

JS 프로젝트는 기본적으로 패키지(=`package.json` 단위)로 쪼개지고, 패키지 간 참조는 npm 배포를 통하는 것이 원칙이다. 하지만 한 팀이 앱과 공용 코드를 함께 개발할 때 매번 배포를 거치는 것은 비효율이라, 저장소 하나에 여러 패키지를 두고 로컬에서 서로 링크하는 monorepo가 보편화됐다.

RN 맥락의 전형적 구성:

```
my-monorepo/
  package.json          # workspaces 루트
  apps/
    mobile/             # RN(Expo) 앱
    web/                # (선택) 웹 앱
  packages/
    ui/                 # 공용 컴포넌트
    api-client/         # 공용 API 타입·클라이언트
    config/             # eslint/tsconfig 공유 설정
```

- **도구**: 패키지 매니저 워크스페이스(pnpm workspaces가 대세, yarn/npm workspaces도 가능)가 심볼릭 링크와 의존성 호이스팅(hoisting)을 처리하고, 그 위에 태스크 오케스트레이터(Turborepo, Nx)가 "바뀐 패키지만 빌드/테스트 + 캐싱"을 담당한다.
- **왜 쓰나**: 앱—공용 패키지 간 변경이 한 커밋/한 PR로 원자적으로 이루어진다. 타입이 소스 레벨로 공유되어 API 클라이언트—앱 간 계약이 어긋나지 않는다. RN 앱과 웹 앱이 UI·비즈니스 로직을 공유하는 시나리오에서 특히 강력하다.

**RN 특유의 주의점 — [[Metro]] 설정**: Metro 번들러는 기본적으로 앱 디렉토리 기준으로 모듈을 찾는다. monorepo에서는 의존성이 루트 `node_modules`로 호이스팅되거나 형제 패키지 소스를 참조해야 하므로, `metro.config.js`에서 `watchFolders`(감시할 루트 경로)와 `resolver.nodeModulesPaths`(모듈 탐색 경로)를 monorepo 루트까지 넓혀줘야 한다. Expo는 SDK 최신 버전에서 monorepo를 상당 부분 자동 감지하지만, 문제가 생기면 이 두 설정을 먼저 의심한다 (정확한 자동화 범위는 공식 문서의 monorepo 가이드 확인).

또 하나의 고전적 함정은 **React 중복 설치**다. 호이스팅이 어긋나 `react`나 `react-native`가 두 벌 설치되면 "Invalid hook call" 류의 에러가 난다. 네이티브로 치면 같은 프레임워크가 두 벌 링크된 심볼 충돌 상황이다. 해결은 버전 통일과 resolver 설정.

Gradle 멀티모듈과 다른 점 하나: 네이티브 빌드 시스템은 모듈 그래프를 빌드 도구가 완전히 이해하지만, JS monorepo는 "패키지 매니저(설치) + Metro(번들) + Turborepo(태스크)"라는 세 도구의 합의로 굴러간다. 그래서 어느 한 도구만 monorepo를 모르면 깨진다 — RN monorepo 이슈의 대부분이 이 지점이다.

## 🔗 관련
[[Metro]] · [[Bundle]] · [[Autolinking]] · [[Prebuild]] · [[EAS]]

# Metro

**한 줄 정의**: RN 전용 JavaScript 번들러 겸 개발 서버. 수천 개의 JS/TS 모듈을 하나의 [[Bundle]]로 묶고, 개발 중에는 HTTP로 코드를 서빙하며 [[Fast Refresh]]를 구동한다.

**iOS/AOS로 치면**: JS 세계의 빌드 시스템. Xcode 빌드 시스템/Gradle이 소스를 컴파일·링크해 바이너리를 만들듯, Metro는 JS 소스를 변환·연결해 번들을 만든다. dev 서버 역할까지 겸한다는 점에서는 "빌드 시스템 + 핫 리로드 데몬"의 결합체.

## 설명

`npx expo start`를 치면 터미널에 뜨는 그 서버가 Metro다.

네이티브 개발자가 처음 혼란스러워하는 지점: **RN 개발 중에는 앱 바이너리와 JS 코드가 분리되어 있다.** Xcode/Gradle이 만든 네이티브 앱은 시작 시 Metro 서버에 HTTP로 접속해 JS 번들을 받아 실행한다. 그래서 JS만 고치면 네이티브 재빌드 없이 몇 초 만에 반영된다. 릴리즈 빌드에서만 번들이 앱 리소스로 내장된다.

Metro의 파이프라인은 3단계다.

1. **Resolve** — `import` 구문을 따라가며 의존성 그래프를 구축한다(어떤 파일이 어떤 파일을 필요로 하는가). 이때 RN 특유의 플랫폼 분기(`Foo.ios.tsx` / `Foo.android.tsx`)도 해석한다.
2. **Transform** — 각 모듈을 Babel로 변환한다. TypeScript/[[JSX]]/최신 문법을 [[Hermes]]가 이해하는 JS로 낮추는 단계. 파일 단위로 병렬 처리되고 캐시된다.
3. **Serialize** — 변환된 모듈들을 하나의 번들 파일로 직렬화한다.

웹 생태계의 webpack/Vite와 같은 부류지만, Metro는 RN에 맞게 특화되어 있다: 플랫폼별 파일 분기, 네이티브 앱과의 통신, [[Fast Refresh]] 지원, 대규모 [[Monorepo]] 대응 등. 설정은 `metro.config.js`로 하며, Expo 프로젝트는 Expo가 확장한 기본 설정을 쓴다. SVG를 컴포넌트로 import하게 하는 등의 커스텀이 필요할 때 이 파일을 만진다.

트러블슈팅 관점에서 알아둘 것들:

- "Unable to resolve module" 에러는 Metro의 resolve 단계 실패다. 캐시 문제면 `--clear`로 캐시 초기화가 단골 처방.
- 시뮬레이터에서 앱이 에러 화면 없이 하얗게 멈춰 있으면 Metro 서버가 안 떠 있는 경우가 많다.
- 실기기 테스트 시 기기와 Mac이 같은 네트워크에 있어야 하는 이유도 앱이 Metro에 HTTP로 붙기 때문이다.

정리하면 Metro는 "개발 중에는 코드를 실시간 서빙하는 서버, 릴리즈 때는 번들을 찍어내는 빌드 도구"라는 두 얼굴을 가진 RN의 JS 빌드 인프라다.

## 관련
[[Bundle]] · [[Fast Refresh]] · [[Hermes]] · [[JSX]] · [[Dev Client]] · [[Monorepo]]

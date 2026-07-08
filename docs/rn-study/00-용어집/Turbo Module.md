# Turbo Module

> [!abstract] 한 줄 정의
> [[New Architecture]]의 네이티브 모듈 시스템. [[JSI]] 기반으로 JS에서 네이티브 기능(카메라, 저장소, 센서 등)을 직접·필요 시 동기 호출하고, 모듈을 처음 사용하는 순간에만 로드(lazy)한다.

> [!info] iOS/AOS로 치면
> 앱에 기능 프레임워크를 붙이는 것과 같은 층위 — "JS 세계에 노출된 네이티브 SDK". 구현체는 결국 Swift/Objective-C/Kotlin 클래스다. lazy 로딩은 dyld의 lazy binding이나 Dagger의 lazy injection과 같은 발상.

## 📖 설명

RN 앱에서 UI가 아닌 네이티브 기능 — 파일 시스템, 키체인, 블루투스, 결제 — 을 JS에서 쓰려면 누군가 그 기능을 JS로 노출해야 한다. 이 노출 단위가 "네이티브 모듈"이고, 신 아키텍처 버전이 Turbo Module이다.

구 아키텍처의 네이티브 모듈은 두 가지 문제가 있었다.

- **eager 초기화** — 앱 시작 시 등록된 모든 모듈을 인스턴스화해서, 쓰지도 않는 모듈이 시작 시간을 잡아먹었다. Turbo Module은 JS가 해당 모듈을 처음 요구하는 순간에 생성한다(lazy).
- **[[Bridge]] 경유** — 모든 호출이 JSON 직렬화 + 비동기 큐를 거쳤다. Turbo Module은 [[JSI]]의 HostObject로 노출되어 JS가 네이티브 메서드를 직접 호출하고, 필요하면 동기 리턴값도 받을 수 있다.

타입 안전은 [[Codegen]]이 담당한다. 모듈의 인터페이스를 TypeScript(또는 Flow) 스펙 파일로 작성하면, 빌드 타임에 iOS용 Objective-C 프로토콜과 Android용 Java/Kotlin 인터페이스가 생성된다. 네이티브 구현체는 이 생성된 인터페이스를 준수해야 하므로, JS가 기대하는 시그니처와 네이티브 구현이 어긋나면 런타임이 아니라 **컴파일 타임에** 깨진다. 네이티브 개발자에게 익숙한 "컴파일러가 계약을 지켜준다"는 안전망이 JS 경계까지 확장된 것이다.

구현 흐름을 요약하면:

1. TypeScript로 스펙 정의
2. [[Codegen]]이 네이티브 인터페이스 생성
3. Swift(Objective-C)/Kotlin으로 구현
4. 모듈 등록 → JS에서 import해서 호출

다만 Expo 프로젝트에서는 raw Turbo Module보다 [[Expo Modules API]]가 선호된다 — Swift/Kotlin DSL로 훨씬 적은 보일러플레이트로 같은 목적을 달성하며, 내부적으로 동일한 신 아키텍처 인프라 위에서 동작한다.

라이브러리 생태계를 볼 때: "이 패키지는 Turbo Module을 지원하는가"는 New Architecture 호환성의 핵심 지표다. 구식 모듈도 interop layer로 당분간 동작하지만, 신규 개발은 Turbo Module 또는 Expo Modules API가 표준이다.

## 🔗 관련
[[JSI]] · [[Codegen]] · [[New Architecture]] · [[Bridge]] · [[Expo Modules API]] · [[Fabric]] · [[Autolinking]]

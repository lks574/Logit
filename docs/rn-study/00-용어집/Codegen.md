# Codegen

**한 줄 정의**: TypeScript/Flow로 작성된 모듈·컴포넌트 스펙에서 iOS(Objective-C)와 Android(Java/Kotlin)용 인터페이스 코드를 **빌드 타임에** 자동 생성하는 [[New Architecture]]의 도구.

**iOS/AOS로 치면**: protobuf/gRPC의 코드 생성, OpenAPI 클라이언트 생성기, Sourcery나 KAPT/KSP 같은 발상. "계약을 한 곳(스키마)에 정의하고, 각 언어의 보일러플레이트는 기계가 만든다."

## 설명

JS와 네이티브는 타입 시스템이 완전히 다르다. 구 아키텍처에서는 JS가 `NativeModules.Foo.bar(42)`를 호출할 때 네이티브 쪽 `bar`가 실제로 무엇을 받는지 아무도 컴파일 타임에 검증하지 않았다. 시그니처가 어긋나면 런타임 크래시나 조용한 오동작으로 발견됐다. 동적 타입 언어와 정적 타입 언어의 경계에서 생기는 전형적인 문제다.

Codegen은 이 경계에 **단일한 진실의 원천(source of truth)** 을 세운다. 개발자가 TypeScript(또는 Flow)로 스펙 파일 — [[Turbo Module]]이면 메서드 시그니처, [[Fabric]] 컴포넌트면 props와 이벤트 정의 — 을 작성하면, 빌드 과정(iOS는 pod install/빌드 시, Android는 Gradle 태스크)에서 이를 파싱해 네이티브 인터페이스 코드를 생성한다.

iOS에는 준수해야 할 프로토콜과 직렬화 헬퍼가, Android에는 추상 클래스/인터페이스가 만들어진다.

네이티브 구현체는 생성된 인터페이스를 구현해야 하므로, JS 스펙과 네이티브 구현이 어긋나면 **컴파일 에러**가 난다.

런타임 계약 위반을 빌드 타임으로 끌어올린 것 — protobuf가 서버/클라이언트 간 메시지 계약을 지켜주는 것과 정확히 같은 가치다.

실무 감각으로 알아둘 점들:

- 생성된 코드는 소스가 아니라 **빌드 산출물**이다. iOS는 pod install 시 생성되어 빌드 디렉토리에 들어가고, 버전 관리에 커밋하지 않는다.
- 스펙 파일에는 관례가 있다 — 모듈 스펙은 `NativeXxx.ts` 같은 네이밍, 지원되는 타입도 제한적(임의의 TS 타입을 다 쓸 수 있는 게 아니다). 상세 규칙은 공식 문서 확인.
- 라이브러리의 `package.json`에 `codegenConfig` 항목이 있으면 "이 패키지는 New Architecture용 스펙을 제공한다"는 신호다.

앱 개발만 할 때는 Codegen을 의식할 일이 거의 없다. 커스텀 네이티브 모듈/컴포넌트를 만들거나, 빌드 로그에서 codegen 관련 에러를 만났을 때 "아, TS 스펙에서 네이티브 인터페이스를 생성하다 실패한 거구나"라고 읽어낼 수 있으면 된다.

Expo의 [[Expo Modules API]]를 쓰면 Codegen 스펙 작성 없이 Swift/Kotlin DSL로 모듈을 만들 수 있다는 것도 참고.

## 관련
[[Turbo Module]] · [[Fabric]] · [[New Architecture]] · [[JSI]] · [[Expo Modules API]]

# Expo Modules API

> [!abstract] 한 줄 정의
> Swift/Kotlin **DSL**로 네이티브 모듈과 네이티브 뷰를 작성하는 Expo의 현대적 네이티브 확장 API. [[Turbo Module]]을 직접 작성하는 것보다 훨씬 적은 보일러플레이트로 같은 목표(JS ↔ 네이티브 연결)를 달성한다.

> [!info] iOS/AOS로 치면
> 네이티브 개발자가 **자기 언어로 RN 세계에 기능을 내보내는 공식 통로**다. 모듈 정의 자체가 Swift의 result builder / Kotlin DSL로 되어 있어, SwiftUI·Compose 스타일의 선언형 코드로 느껴진다.

## 📖 설명

RN 앱에서 JS로 안 되는 것(특정 시스템 API, 기존 네이티브 SDK 연동, 고성능 처리)은 네이티브 모듈로 만든다. 표준 방법은 [[Turbo Module]] + [[Codegen]]인데, 스펙 파일 작성, 코드 생성 설정, 플랫폼별 등록 등 절차가 무겁다. Expo Modules API는 이 과정을 DSL 하나로 압축한 것이다.

```swift
// iOS — Swift
public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyModule")
    Function("hello") { (name: String) -> String in
      "Hello, \(name)!"
    }
    AsyncFunction("batteryLevel") { () -> Float in
      UIDevice.current.batteryLevel
    }
    Events("onChange")
  }
}
```

```kotlin
// Android — Kotlin
class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")
    Function("hello") { name: String -> "Hello, $name!" }
  }
}
```

JS에서는 `requireNativeModule('MyModule')`로 가져와 일반 함수처럼 호출한다. 타입 변환(String, Int, Dictionary/Map, Record 등), 비동기 처리(Promise ↔ AsyncFunction, Kotlin coroutine 지원), 이벤트 발신, 네이티브 뷰 내보내기(`View` 정의 블록 + prop 바인딩)까지 DSL이 전부 흡수한다.

**Turbo Module 직접 작성 대비 장점**:

- TS 스펙 → [[Codegen]] → C++ 인터페이스 구현이라는 다단계 대신, Swift/Kotlin 파일 하나로 끝난다. Objective-C/C++를 만질 일이 없다.
- 모듈 등록·[[Autolinking]]이 자동이다. npm 패키지로 만들면 설치만으로 연결된다.
- 내부적으로 [[JSI]] 기반이라 [[New Architecture]]와 호환되며, 구아키텍처/신아키텍처 양쪽에서 같은 코드가 동작하도록 Expo가 어댑터 계층을 유지한다.
- `npx create-expo-module`로 모듈 프로젝트(예제 앱 포함) 스캐폴딩을 바로 만들 수 있다. 앱 안에 두는 로컬 모듈로도, 배포용 라이브러리로도 가능하다.

**트레이드오프**: expo-modules-core 런타임에 의존하므로 Expo 생태계 바깥의 순수 RN 라이브러리를 만들 때는 채택을 고민하게 된다 (앱이 Expo 기반이면 고민할 이유가 거의 없다). 극단적 저수준 제어(동기 C++ 바인딩 최적화 등)가 필요하면 [[Turbo Module]]을 직접 쓴다.

네이티브 시니어에게 실용적 의미: **RN 팀에서 가장 빨리 기여 가치를 내는 지점**이 여기다. JS 학습이 진행 중이어도 Swift/Kotlin 실력으로 카메라, 헬스킷, 블루투스, 기존 사내 SDK 연동 같은 모듈을 만들어 JS 쪽에 깔끔한 API로 제공할 수 있다. Expo 자체 모듈(expo-camera 등)도 전부 이 API로 작성되어 있어 소스가 좋은 레퍼런스다.

## 🔗 관련
[[Turbo Module]] · [[JSI]] · [[Codegen]] · [[Autolinking]] · [[New Architecture]] · [[Config Plugin]]

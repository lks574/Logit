# Expo Modules API

> [!abstract] 한 줄 요약
> **Swift/Kotlin DSL로 네이티브 모듈과 뷰를 작성하는 방법.** [[Turbo Module]]을 직접 쓰는 것과 같은 일([[JSI]] 기반 네이티브 확장)을 하되, TS 스펙 파일·[[Codegen]] 설정·Objective-C++ 없이 **현대적 Swift/Kotlin만으로** 끝낸다. Expo 프로젝트(Logit 포함)에서 네이티브 확장이 필요하면 이 방식이 1순위다.

## 🔁 iOS-AOS 대응 개념

| Expo Modules 개념 | iOS 감각 | Android 감각 |
|---|---|---|
| `Module` + `definition()` | result builder DSL (SwiftUI의 `body` 감각) | Kotlin DSL (Gradle Kotlin DSL 감각) |
| `Function` | 동기 메서드 노출 | 동일 |
| `AsyncFunction` | `async` 함수 / completion 핸들러 노출 | suspend 함수/Promise 노출 |
| `Events` + `sendEvent` | delegate 콜백 → JS 이벤트 | listener → JS 이벤트 |
| `View` + `Prop` | `UIView` 서브클래스 + 속성 세터 노출 | `View` 서브클래스 + 세터 노출 |
| `Record` | Codable 구조체의 감각 (JS object ↔ 타입) | data class 매핑 |
| `expo-module.config.json` | 모듈 자동 발견용 매니페스트 | 동일 |

## 🧭 왜 이렇게 설계됐나

[[Turbo Module]]/[[Fabric]] Native Component의 정공법([[01-Turbo-Native-Module-작성]], [[02-Fabric-Native-Component]])은 강력하지만 마찰이 크다: TS 스펙 파일 규칙, codegenConfig, Objective-C++ 인터롭, 등록 보일러플레이트. Meta 내부처럼 C++ 인프라가 있는 조직 기준의 설계다.

Expo 팀은 다른 지점을 조준했다 — 공식 문서의 표현을 빌리면 "**현대 언어 기능을 활용하고, 양 플랫폼에서 최대한 일관되며, 보일러플레이트를 최소화**"하는 것:

- **스펙 파일이 없다.** 네이티브 코드의 DSL 선언 자체가 곧 인터페이스다. 타입 변환(JS number/string/object ↔ Swift/Kotlin 타입)은 라이브러리가 리플렉션+제네릭으로 처리한다.
- **Swift와 Kotlin이 1급 시민이다.** Objective-C++를 만질 일이 없다.
- 내부적으로는 [[JSI]] 위에서 동작하므로 성능 특성은 [[Turbo Module]]과 같은 계열이다. [[New Architecture]]와 구 아키텍처를 모두 지원한다.
- 트레이드오프: `expo` 패키지(ExpoModulesCore)에 대한 의존이 생긴다. 공식 문서의 선택 기준도 동일하다 — **C++ 레벨 제어가 필요하면 Turbo Module, 개발 경험을 우선하면 Expo Modules API.**

Expo SDK의 자체 모듈들(expo-camera, expo-notifications...)이 전부 이 API로 작성되어 있다. 즉 "서드파티 우회로"가 아니라 Expo 생태계의 표준 제작 방식이다.

## ⚙️ 동작 원리

1. 모듈 클래스가 `definition()`에서 DSL로 자신의 API를 선언한다.
2. 패키지 루트의 `expo-module.config.json`이 "이 패키지에 Expo 모듈이 있고, 플랫폼별 클래스는 이것"을 선언한다.
3. Expo [[Autolinking]]이 `node_modules`를 스캔해 이 매니페스트를 찾고, pod/Gradle에 자동 편입한다.
4. 런타임에 ExpoModulesCore가 DSL 선언을 읽어 [[JSI]] 바인딩을 만들고, JS에서 `requireNativeModule('MyModule')`로 접근 가능해진다.

### 모듈을 만드는 두 가지 형태

```bash
# 1) 배포용 라이브러리 (npm 패키지, example 앱 포함)
npx create-expo-module@latest my-module

# 2) 앱 로컬 모듈 — Logit 같은 앱 안에 modules/ 디렉토리로
npx create-expo-module@latest --local
```

로컬 모듈이 진입 장벽이 가장 낮다: 앱 리포 안 `modules/my-module/`에 Swift/Kotlin 파일이 생기고, 별도 배포 없이 바로 import해서 쓴다. "이 앱에만 필요한 네이티브 기능 하나"는 무조건 이 경로. 빌드 스크립트·TS 설정 등 라이브러리 인프라는 `expo-module-scripts` 패키지가 표준화해 준다.

## 💻 코드 예시 (Expo SDK 57)

### Swift — 모듈 + 뷰

```swift
import ExpoModulesCore

public class WorkoutKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WorkoutKit")

    // 동기 함수 — 값 변환은 자동
    Function("bmi") { (weightKg: Double, heightM: Double) -> Double in
      weightKg / (heightM * heightM)
    }

    // 비동기 함수 — Swift async/await 그대로
    AsyncFunction("requestAuthorization") { () async throws -> Bool in
      try await HealthStore.shared.requestAuthorization()
    }

    // 이벤트 선언 + 어디서든 sendEvent로 발사
    Events("onHeartRate")
    // 예: 센서 콜백에서 self.sendEvent("onHeartRate", ["bpm": bpm])

    // 네이티브 뷰 노출 — Fabric Native Component에 해당하는 일
    View(HeartRateChartView.self) {
      Prop("lineColor") { (view: HeartRateChartView, color: UIColor) in
        view.lineColor = color   // UIColor 변환도 자동
      }
      Events("onPointPressed")
    }
  }
}
```

### Kotlin — 같은 모듈의 Android 구현

```kotlin
class WorkoutKitModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkoutKit")

    Function("bmi") { weightKg: Double, heightM: Double ->
      weightKg / (heightM * heightM)
    }

    AsyncFunction("requestAuthorization") { promise: Promise ->
      healthClient.requestAuthorization { granted -> promise.resolve(granted) }
    }

    Events("onHeartRate")

    View(HeartRateChartView::class) {
      Prop("lineColor") { view: HeartRateChartView, color: Int ->
        view.lineColor = color
      }
      Events("onPointPressed")
    }
  }
}
```

### JS에서 사용

```ts
import { requireNativeModule, requireNativeView } from 'expo';

const WorkoutKit = requireNativeModule('WorkoutKit');

const bmi = WorkoutKit.bmi(72, 1.78);                  // 동기
const ok = await WorkoutKit.requestAuthorization();     // 비동기
const sub = WorkoutKit.addListener('onHeartRate', (e) => console.log(e.bpm));
```

(생성기 템플릿은 타입이 붙은 래퍼 TS 파일까지 만들어 주므로 실제로는 그 래퍼를 import한다.)

같은 기능을 [[Turbo Module]] 정공법으로 만들 때와 비교하면: TS 스펙 파일 없음, codegenConfig 없음, `pod install` 재실행으로 인터페이스 재생성하는 단계 없음(빌드에 통합), Objective-C++ 없음, 등록 매핑 없음. **양 플랫폼 코드가 거울처럼 대칭**이라는 것도 유지보수에서 크게 다르다.

### 타입 변환의 편의

JS object를 통째로 받고 싶으면 `Record`:

```swift
struct WorkoutOptions: Record {
  @Field var type: String = "run"
  @Field var indoor: Bool = false
}

AsyncFunction("startWorkout") { (options: WorkoutOptions) in ... }
```

`URL`, `UIColor`, enum 등 흔한 타입들이 Convertible로 기본 지원된다. Turbo Module 스펙 타입 제약과 비교하면 확연히 자유롭다. 전체 목록은 [공식 문서](https://docs.expo.dev/modules/module-api/) 참고.

## 어디까지 이걸로 커버하나 — 선택 기준

| 상황 | 권장 |
|---|---|
| Expo 프로젝트에서 네이티브 기능/뷰 추가 (Logit의 케이스) | **Expo Modules API (로컬 모듈)** |
| Expo 없는 Bare/[[Brownfield]] 프로젝트, expo 의존 추가 가능 | Expo Modules API 여전히 가능 (bare 설치 절차 있음) |
| `expo` 패키지 의존이 정책상 불가 | [[Turbo Module]] / [[Fabric]] Component 정공법 |
| C++ 레벨 제어, 커스텀 [[JSI]] 바인딩, 공유 C++ 코어 | [[Turbo Module]] (C++ Turbo Module) |
| RN 코어에 기여 / Meta 스타일 인프라 | 정공법 |

## ⚠️ 함정 (Pitfalls)

- **DSL 클로저의 실행 스레드**: Function/AsyncFunction이 메인 스레드에서 불린다고 가정하지 말 것. UI를 만지는 코드는 `.runOnQueue(.main)` 지정이나 명시적 메인 hop이 필요하다 (View의 Prop 세터는 메인에서 불린다).
- **동기 `Function`에 무거운 일 넣기**: [[Turbo Module]] 동기 메서드와 같은 문제 — JS 스레드가 멈춘다. 기본값은 AsyncFunction.
- **Expo Go 착각**: 내가 만든 로컬 모듈은 [[Expo Go]]에서 안 돌아간다. Expo Go에 구워진 모듈 세트에 없기 때문. [[Dev Client]] 재빌드가 필요하다 — "Expo인데 왜 재빌드?"라는 질문의 답은 항상 이것.
- **네이티브 코드 수정 ≠ Fast Refresh**: Swift/Kotlin을 고치면 네이티브 재빌드다. JS처럼 저장 즉시 반영을 기대하면 안 된다. 개발 중엔 모듈 API 표면을 먼저 확정하고 네이티브 내부를 채우는 순서가 재빌드 횟수를 줄인다.
- **버전 결합**: ExpoModulesCore는 Expo SDK 버전과 함께 움직인다. 라이브러리로 배포할 경우 지원할 SDK 범위를 명시해야 하고, SDK 메이저 업그레이드 시 모듈 API의 deprecation을 확인해야 한다.
- **이름 충돌**: `Name("...")`이 JS에서의 전역 모듈 키다. 다른 패키지와 겹치면 런타임에야 발견된다. 라이브러리라면 고유한 접두어를.

## 🔗 관련 노트

[[Expo Modules API]] · [[Turbo Module]] · [[JSI]] · [[Autolinking]] · [[Dev Client]] · [[Expo Go]] · 이전: [[02-Fabric-Native-Component]] · 다음: [[04-Autolinking과-라이브러리-평가]]

# Autolinking

> [!abstract] 한 줄 정의
> `npm install`로 설치한 패키지에 네이티브 코드가 포함되어 있으면, 이를 iOS의 CocoaPods와 Android의 Gradle 설정에 **자동으로 연결**해 주는 메커니즘.

> [!info] iOS/AOS로 치면
> "npm 패키지 설치 = Podfile에 pod 추가 + settings.gradle에 모듈 추가"를 사람이 아니라 도구가 해주는 것. SPM이 Package.swift의 의존성을 자동 해석해 링크하는 경험과 비슷한데, 그것이 **패키지 매니저 경계(npm→CocoaPods/Gradle)를 넘어** 일어난다.

## 📖 설명

RN 라이브러리는 상당수가 하이브리드다 — JS 코드와 함께 iOS용 Swift/Objective-C, Android용 Kotlin/Java 코드를 품고 있다(카메라, 지도, 애니메이션 라이브러리 등).

JS 부분은 [[Metro]]가 [[Bundle]]에 넣어주면 되지만, 네이티브 부분은 각 플랫폼의 빌드 시스템에 등록되어야 컴파일된다.

과거에는 이것이 수동이었다. 라이브러리 README마다 "Podfile에 이 줄 추가, MainApplication.java에 패키지 등록, settings.gradle 수정…" 같은 설치 안내가 길게 붙어 있었고, 하나만 빠뜨려도 런타임에 "모듈을 찾을 수 없음" 크래시가 났다. 옛 문서에서 보이는 `react-native link` 명령이 이를 반자동화한 초기 시도다.

현재의 Autolinking은 빌드 시점에 동작한다.

- `node_modules`를 스캔해 네이티브 코드를 가진 RN 패키지를 찾아낸다.
- iOS: `pod install` 과정에서 해당 패키지들의 podspec을 Pods 프로젝트에 편입시킨다.
- Android: Gradle 설정 단계에서 해당 모듈들을 빌드에 포함시킨다.

개발자가 하는 일은 `npm install` (그리고 iOS는 pod install에 해당하는 과정) 뿐이다. Expo 프로젝트에서는 [[Prebuild]]가 네이티브 프로젝트를 생성할 때 이 연결까지 포함해 처리한다.

네이티브 개발자에게 중요한 함의: **네이티브 코드가 있는 패키지를 추가하면 반드시 네이티브 재빌드가 필요하다.** JS-only 패키지는 [[Fast Refresh]]로 바로 반영되지만, 네이티브가 낀 패키지는 앱 바이너리를 다시 만들어야 한다.

[[Expo Go]]에서 임의의 네이티브 라이브러리를 못 쓰는 이유이자, [[Dev Client]]를 다시 빌드해야 하는 시점이 바로 "네이티브 코드가 있는 패키지를 추가/제거했을 때"다.

트러블슈팅 단서: 설치는 됐는데 런타임에 "Native module cannot be null" 류의 에러가 나면, autolinking이 반영되기 전의 바이너리를 실행 중일 가능성이 크다 — 네이티브 재빌드가 첫 번째 처방이다.

## 🔗 관련
[[Prebuild]] · [[Dev Client]] · [[Expo Go]] · [[Turbo Module]] · [[Expo Modules API]] · [[Metro]]

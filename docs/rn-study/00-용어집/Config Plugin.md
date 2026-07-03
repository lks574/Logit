# Config Plugin

**한 줄 정의**: Info.plist, AndroidManifest.xml, Podfile, build.gradle 등 네이티브 프로젝트 파일에 가할 수정을 **JS 함수로 선언**해 두면, [[Prebuild]] 시점에 자동 적용되는 Expo의 확장 메커니즘.

**iOS/AOS로 치면**: "라이브러리 README의 수동 설치 안내(plist에 키 추가, Manifest에 권한 추가, Gradle에 한 줄…)를 코드로 자동화한 것". 빌드 설정을 코드로 다룬다는 점에서 fastlane 액션이나 Gradle 커스텀 플러그인과 같은 부류다.

## 설명

[[CNG]] 철학에서는 `ios/`와 `android/`를 직접 수정하지 않는다. 그런데 현실의 앱은 네이티브 설정 수정이 끊임없이 필요하다 — 카메라 권한 문구, 푸시 엔타이틀먼트, Firebase 설정 파일, 특정 SDK가 요구하는 Gradle 옵션.

이 요구를 "생성물 직접 수정" 없이 해결하는 답이 Config Plugin이다.

형태는 단순하다: **config를 받아 수정된 config를 반환하는 JS 함수.** Expo가 `withInfoPlist`, `withAndroidManifest`, `withPodfile` 같은 헬퍼(mod)를 제공하고, 플러그인은 이 헬퍼로 "Info.plist에 `NSCameraUsageDescription`을 추가한다" 같은 변형을 기술한다.

[[Prebuild]]가 네이티브 프로젝트를 생성하는 과정에서 등록된 플러그인들을 순서대로 실행해 변형을 적용한다.

사용자 입장의 경험: 라이브러리를 설치하고 app.json의 `plugins` 배열에 이름(과 옵션)을 추가하면 끝이다. 예컨대 카메라 라이브러리가 자체 Config Plugin을 제공하면, 권한 문구를 옵션으로 넘기는 것만으로 iOS plist와 Android Manifest 양쪽이 알맞게 수정된다.

수동 설치 안내 문서를 따라 하다 한 줄 빠뜨리는 사고가 구조적으로 사라진다.

네이티브 개발자에게 특히 유용한 지점은 **직접 작성**이다. "우리 앱은 Notification Service Extension이 필요하다", "특정 사내 SDK의 Gradle 설정이 필요하다" 같은 커스텀 요구가 있으면 Config Plugin을 직접 작성한다. plist/Manifest가 어떤 구조이고 무엇을 고쳐야 하는지는 네이티브 개발자가 가장 잘 아는 영역이므로, JS 문법만 넘으면 오히려 강점을 발휘할 수 있는 자리다.

한계도 명확하다.

- Config Plugin은 **빌드 타임 설정 수정** 도구이지 런타임 네이티브 로직이 아니다 — 런타임 네이티브 코드가 필요하면 [[Expo Modules API]]나 [[Turbo Module]]의 영역이다.
- 플러그인이 필요한 라이브러리는 [[Expo Go]]에서는 동작하지 않는다(Expo Go의 네이티브 바이너리는 이미 고정되어 있으므로).

그래서 Config Plugin을 쓰기 시작하면 [[Dev Client]] 기반 개발이 사실상 필수가 된다.

## 관련
[[Prebuild]] · [[CNG]] · [[Dev Client]] · [[Expo Go]] · [[Expo Modules API]] · [[EAS]]

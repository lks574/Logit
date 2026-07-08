# Managed Workflow

> [!abstract] 한 줄 정의
> `ios/`·`android/` 네이티브 프로젝트를 개발자가 직접 관리하지 않고 **Expo가 설정(app.json)으로부터 생성·관리**하게 맡기는 개발 방식. 현재는 [[CNG]](Continuous Native Generation)라는 이름의 [[Prebuild]] 기반 모델로 정리되었다.

> [!info] iOS/AOS로 치면
> Xcode 프로젝트 파일(pbxproj)·Gradle 스크립트를 손으로 만지는 대신, 선언적 설정에서 **매번 새로 생성**하는 방식. "pbxproj를 직접 커밋하지 않고 Tuist/XcodeGen 정의에서 생성한다"에 가장 가깝다.

## 📖 설명

RN 앱도 결국 iOS/Android 네이티브 프로젝트 안에서 돈다. 문제는 이 네이티브 프로젝트가 RN 버전 업그레이드마다 바뀌고, 라이브러리 설치마다 수정이 필요하며, 두 플랫폼 분량의 유지보수 지식을 요구한다는 것이다. Managed workflow는 이 부담을 Expo에 위임한다:

- 앱의 네이티브 관련 요구사항(이름, 아이콘, 권한 문구, 스킴, 네이티브 설정)은 전부 `app.json`/`app.config.js`에 선언한다.
- `ios/`·`android/` 디렉토리는 **git에 커밋하지 않는다** (빌드 산출물 취급).
- 빌드가 필요할 때 [[Prebuild]]가 설정 + 설치된 라이브러리의 [[Config Plugin]]들로부터 네이티브 프로젝트를 통째로 생성한다. 이 "필요할 때마다 재생성" 모델을 Expo는 [[CNG]]라 부른다.
- 클라우드 빌드는 [[EAS]] Build가, 로컬 개발 실행은 [[Expo Go]] 또는 [[Dev Client]]가 담당한다.

**"managed vs bare" 경계가 흐려진 이유** — 과거(수년 전)의 managed는 실제 제약이 컸다: Expo에 포함된 네이티브 모듈만 쓸 수 있었고, 커스텀 네이티브 코드가 필요하면 "eject"라는 편도 티켓으로 [[Bare Workflow]]에 떨어져야 했다. 인터넷의 오래된 "Expo는 한계가 있다" 글들은 대부분 이 시대의 이야기다. 현재는:

1. [[Prebuild]] + [[Config Plugin]]으로 **거의 모든 네이티브 설정 변경**을 managed 상태 그대로 표현할 수 있다.
2. [[Expo Modules API]]와 로컬 모듈로 **커스텀 Swift/Kotlin 코드**도 managed 프로젝트에 넣을 수 있다.
3. eject라는 개념은 폐기되었다. `npx expo prebuild`로 네이티브 프로젝트를 꺼내 보는 것은 언제든 가능하고, 커밋 여부만 선택하면 된다.

그래서 현재 시점의 실질적 구분은 "managed vs bare"라기보다 **"네이티브 디렉토리를 git이 소유하는가, 생성기가 소유하는가"**다. 생성기 소유(CNG)의 장점은 RN/Expo SDK 업그레이드가 극적으로 쉬워진다는 것 — 네이티브 프로젝트에 쌓인 수동 수정과 신버전 템플릿을 병합하는 지옥 대신, 새 템플릿으로 재생성하면 끝이다. 선언되지 않은 상태가 없으므로 재현성도 좋다.

대가는 "네이티브 프로젝트를 직접 열어 임의 수정"이 금지된다는 것 (수정해도 다음 prebuild 때 날아간다). 모든 커스터마이즈는 Config Plugin으로 코드화해야 하며, 플러그인으로 표현 못 하는 극단적 케이스에서만 [[Bare Workflow]]로 전환한다. 네이티브 시니어 입장에서는 "Xcode에서 체크박스 하나 켜면 되는 일을 플러그인으로 작성"하는 우회가 처음엔 답답할 수 있지만, 그 우회가 업그레이드 비용을 사는 보험이다.

일상 개발 흐름은 이렇다: 평소에는 JS만 만지며 [[Dev Client]]/[[Expo Go]]로 개발하고, 네이티브 의존성이 바뀌었을 때만 prebuild + 네이티브 재빌드가 일어난다. Xcode/Android Studio를 여는 일은 디버깅 등 예외 상황으로 줄어든다.

이 레포(Logit)도 이 방식이다 — `ios/`·`android/`는 커밋되지 않고, 네이티브 상태는 `app.json`과 의존성 목록이 전부 결정한다.

## 🔗 관련
[[CNG]] · [[Prebuild]] · [[Config Plugin]] · [[Bare Workflow]] · [[EAS]] · [[Expo Go]] · [[Dev Client]] · [[Expo Modules API]]

# Prebuild

**한 줄 정의**: `npx expo prebuild` — app.json(app.config.js)의 설정과 [[Config Plugin]]들을 읽어 `ios/`와 `android/` 네이티브 프로젝트 전체를 **생성**하는 Expo 명령. [[CNG]] 철학의 실행 도구.

**iOS/AOS로 치면**: 프로젝트 제너레이터. Xcode의 "New Project" 템플릿 생성을 매번, 결정적으로(deterministic), 내 설정 파일 기반으로 다시 돌리는 것. `xcodegen`이나 `tuist generate`로 .xcodeproj를 생성물 취급하는 워크플로우를 아는 사람이라면 정확히 그 감각이다.

## 설명

Expo 프로젝트의 소스 트리를 처음 보면 네이티브 개발자는 당황한다 — `ios/` 폴더도 `android/` 폴더도 없다. 앱 이름, 번들 ID, 권한 문구, 아이콘, 스플래시 같은 것들이 전부 `app.json` 한 파일에 선언되어 있을 뿐이다.

이 선언에서 실제 Xcode 프로젝트와 Gradle 프로젝트를 만들어내는 명령이 prebuild다.

prebuild가 하는 일:

1. 최신 템플릿에서 `ios/`, `android/` 디렉토리 생성
2. app.json의 값들을 Info.plist, AndroidManifest.xml, build.gradle 등에 반영
3. 설치된 패키지들의 [[Config Plugin]]을 실행해 필요한 네이티브 설정 수정을 적용
4. 네이티브 의존성 연결([[Autolinking]] 포함)

결과물은 평범한 네이티브 프로젝트라서, 생성 후 Xcode/Android Studio로 열어 빌드·디버깅할 수 있다.

핵심 발상은 **생성된 네이티브 프로젝트를 소스가 아니라 빌드 산출물로 취급**하는 것이다([[CNG]] 참고). `ios/`와 `android/`를 git에 커밋하지 않고(.gitignore), 필요할 때마다 다시 생성한다. `--clean` 플래그는 기존 디렉토리를 지우고 처음부터 다시 만든다 — 생성물에 수동 수정이 섞이는 것을 막는 안전장치다.

왜 이렇게 하는가. 네이티브 프로젝트 파일(특히 .pbxproj)은 머지 충돌의 온상이고, RN/Expo 버전 업그레이드 때마다 템플릿 변경분을 수동으로 따라가야 한다. 생성물로 취급하면 업그레이드가 "새 템플릿으로 재생성"으로 단순해지고, 모든 네이티브 설정이 app.json + Config Plugin이라는 리뷰 가능한 선언으로 모인다.

주의할 계약: **생성된 `ios/`/`android/`를 직접 수정하면 다음 prebuild 때 사라진다.** 네이티브 수정이 필요하면 Config Plugin으로 선언하거나, 아니면 생성물을 커밋하고 prebuild를 포기하는 [[Bare Workflow]] 쪽으로 넘어가는 선택을 해야 한다.

[[EAS]] 클라우드 빌드는 `ios/`가 없으면 빌드 전에 prebuild를 자동 실행하므로, 로컬에서 매번 직접 돌릴 필요는 없다.

## 관련
[[CNG]] · [[Config Plugin]] · [[Autolinking]] · [[EAS]] · [[Managed Workflow]] · [[Bare Workflow]] · [[Dev Client]]

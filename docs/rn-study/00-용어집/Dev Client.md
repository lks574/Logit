# Dev Client

> [!abstract] 한 줄 정의
> **내 프로젝트의 네이티브 코드가 전부 포함된 개발 전용 앱 빌드**(expo-dev-client 패키지 탑재). [[Expo Go]]와 달리 어떤 네이티브 라이브러리든 쓸 수 있으면서, JS는 [[Metro]]에서 받아 [[Fast Refresh]]로 개발한다.

> [!info] iOS/AOS로 치면
> 평소 Xcode/Android Studio에서 돌리는 Debug 빌드와 같다 — 내 코드가 다 들어간 진짜 내 앱. 차이는 JS 부분이 바이너리에 고정되지 않고 dev 서버에서 실시간으로 로드되며, 개발자 메뉴·서버 선택 UI가 붙어 있다는 것.

## 📖 설명

RN 개발의 핵심 이점은 "JS 수정은 재빌드 없이 즉시 반영"이다. 이를 극단화한 것이 [[Expo Go]] — 미리 빌드된 공용 앱에 내 JS만 얹는 방식이다.

하지만 Expo Go의 네이티브 바이너리는 고정되어 있어서, 커스텀 네이티브 모듈이나 [[Config Plugin]]이 필요한 라이브러리는 쓸 수 없다. 실전 앱은 거의 예외 없이 이 벽에 부딪힌다.

Dev Client는 그 벽을 없앤 절충안이다. `expo-dev-client` 패키지를 설치하고 내 프로젝트를 빌드하면([[Prebuild]] → Xcode/Gradle 빌드, 또는 [[EAS]] 클라우드 빌드), **내 앱의 네이티브 코드 + 개발 편의 기능**이 합쳐진 개발용 바이너리가 나온다.

이 앱을 시뮬레이터/실기기에 설치해 두면, 이후에는 Expo Go처럼 Metro 서버에 붙어 JS를 실시간으로 로드하며 개발한다. 개발자 메뉴, 접속할 dev 서버 선택 화면, 에러 UI 같은 도구가 내장된다.

멘탈 모델은 **"네이티브 계층과 JS 계층의 변경 주기 분리"** 다.

- JS/TS만 수정 → 재빌드 불필요, [[Fast Refresh]]로 즉시 반영. 일상 개발의 99%.
- 네이티브가 낀 변경(네이티브 코드 있는 패키지 추가/제거, [[Config Plugin]] 변경, 앱 아이콘/권한 변경) → Dev Client **재빌드 필요**.

네이티브 개발자라면 "네이티브는 어차피 내가 빌드하던 방식 그대로, JS만 핫로드가 얹힌 것"으로 이해하면 정확하다.

팀 관점의 활용: [[EAS]] Build로 Dev Client를 만들어 배포해 두면, 디자이너나 JS 개발자는 Xcode 없이 그 앱만 설치하고 Metro에 붙어 개발할 수 있다.

네이티브 담당자가 Dev Client를 갱신·배포하고 나머지는 JS 사이클로 도는 분업이 가능하다.

Expo SDK 57 / 실전 프로젝트 기준, **개발은 Dev Client로 하는 것이 표준**이고 Expo Go는 학습·프로토타입용이다. 이 vault의 프로젝트(Logit)도 Expo Go 불가 → Dev Client 기반이다.

## 🔗 관련
[[Expo Go]] · [[Metro]] · [[Fast Refresh]] · [[Prebuild]] · [[EAS]] · [[Config Plugin]] · [[Autolinking]]

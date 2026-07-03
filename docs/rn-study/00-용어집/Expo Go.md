# Expo Go

**한 줄 정의**: App Store/Play Store에서 받는 **미리 빌드된 샌드박스 앱**. 내 프로젝트의 JS 번들을 QR 코드로 로드해 즉시 실행해 볼 수 있지만, 커스텀 네이티브 코드는 넣을 수 없다.

**iOS/AOS로 치면**: Swift Playgrounds 앱에 가깝다 — 코드를 실행해 볼 수 있는 미리 만들어진 호스트 환경. 내 앱이 아니라 "Expo가 빌드해서 스토어에 올려둔 범용 러너" 안에서 내 코드가 도는 것이다.

## 설명

RN 입문의 마찰을 없애기 위한 도구다. 원래 모바일 개발 시작에는 Xcode/Android Studio 설치, 인증서, 프로비저닝이 필요하지만, Expo Go를 쓰면 `npx expo start`로 [[Metro]]를 띄우고 폰의 Expo Go 앱으로 QR을 찍는 것만으로 실기기에서 내 코드가 돈다.

Mac 없이 Windows에서 iOS 기기로 확인하는 것도 가능하다. "설치 5분 만에 폰에서 내 화면 보기"라는 경험은 여전히 강력하다.

구조를 이해하면 한계도 자명해진다. Expo Go는 **네이티브 바이너리가 이미 고정된 앱**이다.

Expo SDK의 표준 모듈들(카메라, 위치, 센서 등)이 미리 컴파일되어 들어 있고, 내가 주입할 수 있는 것은 JS [[Bundle]]뿐이다. 따라서:

- **커스텀 네이티브 모듈 불가.** 네이티브 코드가 포함된 서드파티 패키지, 직접 만든 [[Turbo Module]]/[[Expo Modules API]] 모듈, [[Config Plugin]]이 필요한 라이브러리는 동작하지 않는다. Expo Go 바이너리에 그 코드가 없기 때문이다.
- **SDK 버전 종속.** Expo Go 앱은 특정 Expo SDK 버전(들)과 짝지어져 있다. 내 프로젝트의 SDK 버전과 Expo Go가 지원하는 버전이 어긋나면 실행이 안 된다. 스토어에서 Expo Go가 업데이트되면 구버전 프로젝트가 갑자기 안 열리는 일도 생긴다.
- **앱 정체성 커스텀 불가.** 아이콘, 스플래시, 번들 ID, 푸시 인증 설정 같은 것은 Expo Go 자체의 것이므로 내 앱의 것으로 확인할 수 없다.

그래서 포지셔닝이 명확하다: **학습, 튜토리얼, 빠른 프로토타입까지는 Expo Go, 실제 제품 개발은 [[Dev Client]]로.**

실전 프로젝트는 거의 반드시 네이티브 커스텀이 필요해지는 시점이 오고, 그때 Dev Client로 전환한다. 전환은 어렵지 않다 — 같은 코드베이스에서 개발용 바이너리만 직접 빌드하는 것이다.

이 vault의 프로젝트(Logit)는 Expo SDK 57에서 Expo Go로 실행 불가라 처음부터 Dev Client를 쓴다.

RN 커뮤니티의 오래된 통념 중 "Expo는 네이티브 못 만져서 한계가 있다"는 말은 Expo Go 시절의 이야기이며, 현재의 Expo([[Prebuild]]+[[Config Plugin]]+Dev Client)에는 해당하지 않는다는 점도 구분해 두자.

## 관련
[[Dev Client]] · [[Metro]] · [[Bundle]] · [[Config Plugin]] · [[Managed Workflow]] · [[EAS]]

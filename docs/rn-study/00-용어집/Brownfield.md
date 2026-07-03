# Brownfield

**한 줄 정의**: **이미 존재하는 네이티브 앱**에 React Native를 라이브러리처럼 삽입해, 일부 화면·기능만 RN으로 만드는 통합 방식. 앱의 주인은 여전히 네이티브이고 RN은 세입자다. 반대말은 [[Greenfield]].

**iOS/AOS로 치면**: 앱 일부 화면만 SwiftUI로 전환할 때 `UIHostingController`로 감싸 UIKit 내비게이션에 끼워 넣는 것, Compose를 `ComposeView`로 기존 View 계층에 넣는 것과 정확히 같은 패턴이다. 호스팅 컨테이너만 RN 것으로 바뀐다.

## 설명

수년 된 대형 네이티브 앱을 통째로 RN으로 재작성하는 것은 비현실적이다. brownfield는 그 대안으로, 기존 앱 구조를 유지한 채 특정 화면(설정, 프로모션, 커뮤니티 등)부터 RN으로 만들어 점진적으로 도입한다. 페이스북 앱 자체가 원조 brownfield였고, 대형 서비스들의 RN 도입은 대부분 이 형태로 시작한다.

**구조** — 핵심은 "RN 화면을 네이티브 컨테이너로 감싸기"다:

- iOS: RN 루트 뷰를 담은 **ViewController**를 만들어 기존 `UINavigationController`에 push하거나 present한다.
- Android: RN 루트 뷰를 담은 **Activity 또는 Fragment**를 기존 내비게이션 플로우에 끼워 넣는다.
- 그 컨테이너 안에서만 React 세계([[JSX]], [[State]], [[Reconciliation]])가 돌아간다. 컨테이너 밖은 평소의 네이티브 앱이다.
- 네이티브 → RN으로 초기 데이터는 initial props로 주입하고, RN → 네이티브 통신은 네이티브 모듈([[Turbo Module]] 등)로 한다.

**greenfield 대비 감수해야 하는 것들**:

- **런타임 수명 관리** — RN 런타임([[Hermes]] 인스턴스)과 JS [[Bundle]] 로딩을 앱이 직접 관리해야 한다. 첫 RN 화면 진입 시 초기화 지연을 숨기는 워밍업 전략, 여러 RN 화면 간 런타임 공유 등이 설계 이슈가 된다.
- **내비게이션 이원화** — 화면 전환이 네이티브 스택과 RN 내부 내비게이션([[React Navigation]])에 걸쳐 일어나므로 경계 설계가 필요하다. 흔한 패턴은 "RN 화면 묶음 하나 = 네이티브 컨테이너 하나"로 경계를 굵게 긋는 것.
- **빌드 통합** — 기존 Xcode/Gradle 빌드에 RN 의존성(CocoaPods/Gradle + [[Autolinking]])과 [[Metro]] 번들링 단계를 얹어야 한다. 정의상 [[Bare Workflow]]이므로 [[CNG]]의 자동화 혜택은 제한적이다. 다만 Expo도 brownfield 통합 가이드를 제공한다 (지원 범위는 공식 문서 확인).
- **개발 경험 분절** — RN 파트는 [[Fast Refresh]]를 누리지만, 진입하려면 네이티브 앱 빌드가 먼저 필요하다. 팀도 네이티브/RN 양쪽 역량이 상시 필요하다.

**언제 선택하나**: 기존 앱 자산이 크고, 전면 재작성 리스크를 질 수 없으며, 일부 영역에서 배포 속도([[OTA Update]] 포함)나 크로스 플랫폼 공유의 이득을 보고 싶을 때. 반대로 새 앱이라면 이 복잡도를 질 이유가 없으므로 [[Greenfield]]로 간다.

네이티브 시니어에게는 사실 가장 익숙하게 진입할 수 있는 지형이다 — 앱의 뼈대, 빌드, 수명 주기가 전부 익숙한 네이티브 영역에 남아 있고, RN은 잘 정의된 경계 뒤의 렌더링 엔진으로 취급할 수 있기 때문이다.

## 관련
[[Greenfield]] · [[Bare Workflow]] · [[Metro]] · [[Bundle]] · [[Hermes]] · [[React Navigation]] · [[Autolinking]]

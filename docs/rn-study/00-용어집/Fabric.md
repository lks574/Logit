# Fabric

> [!abstract] 한 줄 정의
> [[New Architecture]]의 렌더링 시스템. C++로 작성된 코어가 React 트리를 [[Shadow Tree]]로 변환·레이아웃 계산하고, 그 결과를 각 플랫폼의 네이티브 뷰(UIView / android.view.View)로 반영한다.

> [!info] iOS/AOS로 치면
> UIKit의 렌더 파이프라인(레이아웃 → 커밋 → 화면 반영)이나 Compose의 Composition → Layout → Drawing 단계에 해당하는 RN 내부 구현. 개발자가 직접 호출하는 API라기보다 "프레임워크의 렌더링 엔진"이다.

## 📖 설명

RN에서 `<View>`, `<Text>` 같은 컴포넌트를 선언하면 최종적으로 진짜 UIView/View 인스턴스가 만들어져야 한다. 이 "React 선언 → 네이티브 뷰" 변환을 담당하는 것이 렌더러이고, 신 아키텍처의 렌더러가 Fabric이다. 구 아키텍처에서는 이 역할을 UIManager라는 모듈이 [[Bridge]] 너머에서 비동기로 수행했다.

Fabric의 구조적 특징은 **코어가 C++ 단일 구현**이라는 점이다. 구 렌더러는 iOS/Android 각각 별도 구현이라 동작 차이와 중복이 있었지만, Fabric은 레이아웃·트리 관리 로직을 C++로 한 번 작성하고 플랫폼별로는 얇은 마운팅 레이어만 둔다.

렌더링 파이프라인은 대략 세 단계로 흐른다:

1. **Render** — React의 선언이 [[Shadow Tree]](레이아웃 계산용 트리)로 만들어진다.
2. **Commit** — [[Yoga]]가 각 노드의 위치·크기를 계산하고 새 트리가 확정된다.
3. **Mount** — 이전 트리와의 차이만 네이티브 뷰 트리(UIView / android.view.View)에 반영된다.

**동기 레이아웃 측정**이 가능해진 것이 실질적으로 큰 변화다. [[JSI]] 위에서 동작하므로 JS가 "이 뷰의 측정 결과"를 동기적으로 받을 수 있고, 중요한 UI 업데이트(예: 사용자 입력에 대한 즉각 반응)를 우선순위 높게, 필요하면 동기적으로 처리할 수 있다. 구 아키텍처에서 빠른 스크롤 시 빈 셀이 번쩍이던 문제가 구조적으로 개선된 배경이다.

또 하나의 설계 축은 **Shadow Tree의 불변성(immutability)** 이다. 렌더 중인 트리를 직접 수정하지 않고, 새 트리를 만들어 비교 후 통째로 커밋한다. 덕분에 여러 스레드에서 안전하게 트리를 다룰 수 있고, React 18의 concurrent rendering(작업 중단·재개·우선순위 조정)을 네이티브 렌더링까지 일관되게 지원한다. iOS 개발자라면 "값 타입/불변 스냅샷을 쓰면 스레드 안전과 되돌리기가 공짜로 따라온다"는 감각과 같다.

라이브러리 관점에서는, 커스텀 네이티브 뷰를 노출하는 컴포넌트를 "Fabric Native Component"라 부르고 [[Codegen]]으로 인터페이스를 생성한다. 라이브러리의 "New Architecture 지원"은 대부분 "Fabric 컴포넌트 + [[Turbo Module]]로 마이그레이션됐는가"를 뜻한다.

일상 개발에서 Fabric을 직접 조작할 일은 없다.

다만 렌더링 성능 이슈를 파고들거나, 네이티브 뷰를 래핑하는 라이브러리를 만들거나, "왜 이 라이브러리는 New Arch에서 안 돌지?"를 판단할 때 이 그림이 필요하다.

## 🔗 관련
[[Shadow Tree]] · [[Yoga]] · [[JSI]] · [[New Architecture]] · [[Turbo Module]] · [[Codegen]] · [[Reconciliation]]

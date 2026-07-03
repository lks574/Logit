# Shadow Tree

**한 줄 정의**: React 컴포넌트 트리와 실제 네이티브 뷰 트리 사이에 존재하는 **레이아웃 계산 전용 중간 트리**. 각 노드(Shadow Node)가 스타일·크기 정보를 들고 있고, [[Yoga]]가 이 트리 위에서 위치와 크기를 계산한다.

**iOS/AOS로 치면**: 뷰를 실제로 그리기 전에 프레임을 계산해 두는 별도 자료구조. Texture(AsyncDisplayKit)의 노드 트리, 또는 Compose에서 Composition과 실제 그리기 사이의 LayoutNode 트리에 가깝다. "UIView를 만지지 않고도 레이아웃을 계산할 수 있는 경량 표현".

## 설명

RN의 렌더링은 3단 트리 구조로 이해하면 정확하다.

1. **React 트리** (JS) — 컴포넌트가 선언한 엘리먼트 구조.
2. **Shadow Tree** (C++) — 각 엘리먼트에 대응하는 Shadow Node들이 스타일과 레이아웃 제약을 들고 있는 트리.
3. **네이티브 뷰 트리** (플랫폼) — 실제 UIView / android.view.View 인스턴스.

React 트리가 바뀌면 → Shadow Tree가 갱신·재계산되고 → 그 차이만 네이티브 뷰 트리에 반영된다.

왜 중간 트리가 필요한가. 실제 뷰 객체는 무겁고, 생성·조작이 메인(UI) 스레드에 묶여 있다. 레이아웃 계산까지 UI 스레드에서 하면 JS의 잦은 업데이트가 프레임 드랍으로 직결된다. Shadow Tree는 뷰 객체 없이 순수 데이터로만 구성되므로 **백그라운드 스레드에서 자유롭게 레이아웃을 계산**할 수 있고, 확정된 결과만 UI 스레드에 커밋한다.

iOS에서 `systemLayoutSizeFitting`을 백그라운드에서 못 돌려서 셀 높이 계산 캐시를 만들던 경험이 있다면, 그 문제를 구조적으로 해결한 형태라고 보면 된다.

[[New Architecture]]의 [[Fabric]]에서 Shadow Tree는 **불변(immutable)** 이다. 상태가 바뀌면 기존 트리를 수정하는 게 아니라 새 트리를 만들고(변경 없는 노드는 공유), 완성된 새 트리와 이전 트리를 비교해 최소 변경분(mutation)을 산출한 뒤 원자적으로 커밋한다. 불변이므로 여러 스레드가 동시에 읽어도 안전하고, React 18의 concurrent rendering — 렌더 작업을 중단했다가 버리거나 재개하는 것 — 이 네이티브 레이아웃 레벨까지 성립한다.

개발 중 이 개념을 만나는 순간들:

- `onLayout` 콜백으로 받는 값이 바로 Shadow Tree에서 계산된 레이아웃 결과다.
- `measure()` 계열 API도 이 트리를 조회한다.
- 성능 문서의 "commit phase", "mount phase" 같은 용어는 Shadow Tree → 네이티브 뷰 트리로 반영되는 단계를 말한다.

## 관련
[[Fabric]] · [[Yoga]] · [[Reconciliation]] · [[New Architecture]] · [[Re-render]]

# Hook

**한 줄 정의**: 함수 컴포넌트에 상태([[State]])·생명주기·컨텍스트 같은 React 기능을 "걸어 쓸(hook into)" 수 있게 해주는 특수한 함수. 이름이 `use`로 시작한다 (`useState`, `useEffect`, `useRef` 등).

**iOS/AOS로 치면**: SwiftUI의 프로퍼티 래퍼(`@State`, `@Environment`, `.onAppear`)와 Compose의 `remember`/`LaunchedEffect` 계열. "선언형 UI 함수가 호출 간에 살아남는 상태와 부수효과를 갖게 하는 장치"라는 역할이 같다.

## 설명

React 컴포넌트는 그냥 함수라서, 원래대로라면 호출이 끝나면 지역 변수가 전부 사라진다. 그런데 UI에는 "이전 렌더의 값을 기억하는 상태", "화면에 나타났을 때 실행할 코드" 같은 것이 필요하다. Hook은 이 능력을 함수 컴포넌트에 주입하는 공식 API다. 클래스 컴포넌트의 `this.state`와 생명주기 메서드(`componentDidMount` 등)를 대체하며, 현재 React에서는 Hook 기반 함수 컴포넌트가 표준이다.

대표적인 내장 Hook:

- `useState` — 렌더 간에 유지되는 상태값과 갱신 함수를 리턴. → [[State]]
- `useEffect` — 렌더 결과가 반영된 후 실행할 부수효과(구독, 타이머, 데이터 요청 등)를 등록. 의존성 배열로 재실행 조건을 제어. → [[Stale Closure]]
- `useRef` — 리렌더를 일으키지 않고 값을 담아두는 가변 상자. UIView 참조 보관 용도로도 사용.
- `useMemo` / `useCallback` — 계산 결과·함수를 캐싱. → [[Memoization]]
- `useContext` — 트리 상위에서 내려주는 값(SwiftUI `@Environment` 유사)을 읽음.

**Rules of Hooks** — Hook에는 두 가지 강제 규칙이 있다:

1. **최상위(top level)에서만 호출한다.** `if`, `for`, 중첩 함수 안에서 호출 금지.
2. **React 함수(컴포넌트 또는 커스텀 Hook) 안에서만 호출한다.** 일반 JS 함수에서 호출 금지.

이 규칙이 존재하는 이유는 React의 구현 방식 때문이다. React는 Hook을 이름이나 키로 식별하지 않고, **컴포넌트당 호출 순서**로 식별한다. 첫 렌더에서 `useState`가 1번, 2번, 3번 순서로 불렸다면, 다음 [[Re-render]]에서도 정확히 같은 순서로 불린다고 가정하고 내부적으로 저장해 둔 상태 목록을 순서대로 매칭한다. 만약 조건문 안에서 Hook을 호출하면 렌더마다 호출 개수/순서가 달라져서 2번째 상태가 3번째 자리에 매칭되는 식으로 전부 어긋난다. 그래서 lint 규칙(`eslint-plugin-react-hooks`)이 이를 컴파일 타임에 잡아준다.

`use`로 시작하는 함수를 직접 만들어 여러 Hook을 조합할 수도 있다. 이것이 **커스텀 Hook**이며, React에서 로직 재사용의 기본 단위다 (예: `useDebounce`, `useAppState`). 클래스 상속이나 믹스인 대신 이 방식을 쓴다.

네이티브 개발자가 처음 헷갈리는 지점: `useState`의 값은 "지금 이 렌더의 스냅샷"이다. 갱신 함수를 불러도 현재 실행 중인 함수 안의 변수는 안 바뀌고, 다음 렌더에서 새 값으로 함수가 다시 실행된다. 이 멘탈모델은 [[State]]와 [[Stale Closure]] 노트에서 자세히 다룬다.

## 관련
[[State]] · [[Props]] · [[Re-render]] · [[Stale Closure]] · [[Memoization]]

# Memoization

> [!abstract] 한 줄 정의
> 같은 입력이면 이전 결과를 재사용해 불필요한 재계산·[[Re-render]]를 건너뛰는 최적화. React에서는 `React.memo`(컴포넌트), `useMemo`(값), `useCallback`(함수) 세 가지 도구로 한다.

> [!info] iOS/AOS로 치면
> SwiftUI가 `Equatable` 뷰의 body 재평가를 건너뛰는 것, Compose의 skippable composable + `remember(key) { ... }` 캐싱. "입력이 안 바뀌었으면 다시 계산하지 마라"는 발상이 같다.

## 📖 설명

React의 기본 동작은 단순 무식하다: 부모가 리렌더되면 자식도 무조건 리렌더된다([[Re-render]] 전파 규칙). 대부분은 이게 충분히 빠르지만, 트리가 크거나 렌더 비용이 높은 컴포넌트가 있으면 세 가지 도구로 선택적으로 차단한다.

- **`React.memo(Component)`** — 컴포넌트를 감싸면, 부모가 리렌더돼도 [[Props]]가 **얕은 비교(shallow equal)**로 같을 때 자식 리렌더를 건너뛴다. "props가 안 바뀌었으면 결과도 같다"는 순수성 가정에 기반한다.
- **`useMemo(() => 계산, [deps])`** — 렌더 중의 비싼 계산 결과를 캐싱. deps가 안 바뀌면 이전 값을 리턴한다.
- **`useCallback(fn, [deps])`** — 함수의 **참조**를 캐싱. `useMemo(() => fn, deps)`와 동등하다.

셋이 한 세트인 이유: `React.memo`는 얕은 비교를 하는데, 렌더마다 새로 생성되는 객체/배열/함수 리터럴은 내용이 같아도 **참조가 매번 다르다**. `<Child onPress={() => ...} style={{...}} />`처럼 넘기면 memo가 매번 "props 바뀜"으로 판정해 무력화된다. 그래서 memo된 자식에 넘기는 함수는 `useCallback`으로, 객체는 `useMemo`로 참조를 고정해줘야 memo가 실제로 작동한다.

**언제 쓰나** (근거 있는 사용처):

- 프로파일링으로 확인된 비싼 렌더 서브트리를 `React.memo`로 차단할 때.
- [[FlatList]]의 `renderItem` 아이템 컴포넌트 — 리스트는 리렌더 증폭이 커서 memo 효과가 크다.
- `useEffect` 의존성으로 들어가는 객체/함수의 참조 안정화 (참조가 매번 바뀌면 effect가 매 렌더 재실행된다).
- 실제로 무거운 계산(큰 배열 정렬/필터 등)의 `useMemo`.

**언제 과잉인가**:

- **기본값으로 전부 감싸기.** 비교 비용 + 캐시 메모리 + 코드 노이즈가 공짜가 아니다. 렌더가 이미 싼 컴포넌트에는 순손실이다.
- 원시값 몇 개짜리 계산에 `useMemo` — 캐싱이 계산보다 비싸다.
- memo 없는 자식에게 넘길 함수에 `useCallback` — 받는 쪽이 참조 비교를 안 하면 의미가 없다.
- 구조적 해결이 가능한 경우: state를 사용하는 곳 가까이로 내리거나(colocation), 무거운 자식을 `children`으로 받아 리렌더 경로 밖에 두는 편이 memo보다 근본적이다.

주의: memoization은 **의미(정합성) 보장 장치가 아니라 성능 힌트**다. React는 필요하면 캐시를 버릴 수 있다고 문서에 명시하므로, "한 번만 실행됨"에 의존하는 로직을 두면 안 된다. 또한 `useCallback`의 deps를 누락하면 [[Stale Closure]]를 캐싱해 두는 셈이 된다 — 최적화하려다 버그를 만드는 전형적 경로다.

참고로 React Compiler(자동 memoization 컴파일러)가 수동 memo 작성을 대체하는 방향으로 진행 중이다. 도입 상태와 RN 지원 범위는 공식 문서 확인.

## 🔗 관련
[[Re-render]] · [[Props]] · [[Hook]] · [[Stale Closure]] · [[FlatList]]

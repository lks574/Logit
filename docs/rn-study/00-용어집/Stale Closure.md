# Stale Closure

> [!abstract] 한 줄 정의
> 클로저가 생성 시점의 오래된(stale) [[State]]/[[Props]] 값을 캡처한 채 나중에 실행되어, 최신 값 대신 옛 값으로 동작하는 버그 패턴. React 함수 컴포넌트에서 가장 흔한 버그 중 하나.

> [!info] iOS/AOS로 치면
> Swift 클로저가 값 타입을 캡처해서 이후 변경이 반영되지 않는 상황, 또는 `[weak self]` 없이 옛 컨텍스트를 붙들고 있는 콜백과 유사하다. 다만 React에서는 "렌더마다 함수가 통째로 재실행된다"는 모델 때문에 훨씬 구조적으로 발생한다.

## 📖 설명

[[Re-render]] 모델을 떠올리면: 컴포넌트 함수는 state가 바뀔 때마다 다시 실행되고, **각 렌더는 그 시점 state의 스냅샷**을 가진다. 렌더 중에 만든 모든 함수(이벤트 핸들러, `useEffect` 콜백, 타이머 콜백)는 자신이 만들어진 렌더의 변수들을 클로저로 캡처한다. 그 함수가 "나중에" 실행되면, 화면은 이미 몇 렌더 뒤인데 함수는 옛 스냅샷을 보고 있다 — 이것이 stale closure다.

대표 예시 — 1초마다 카운트를 올리려는 코드:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // 첫 렌더의 count(=0)를 캡처!
    }, 1000);
    return () => clearInterval(id);
  }, []); // 빈 배열: 이 effect는 마운트 시 한 번만 실행

  return <Text>{count}</Text>;
}
```

기대: 1, 2, 3, … 실제: **1에서 멈춘다.** effect가 첫 렌더에서 한 번만 실행됐고, 그 안의 인터벌 콜백은 첫 렌더의 `count = 0`을 영원히 캡처하고 있다. 매초 `setCount(0 + 1)`만 반복하는 것이다.

**useEffect 의존성 배열과의 관계** — 의존성 배열은 정확히 이 문제를 위한 장치다. "이 effect가 읽는 반응형 값이 바뀌면 effect를 새로 실행해서, 새 스냅샷을 캡처한 새 클로저로 교체하라"는 선언이다. 위 코드에서 `[count]`로 바꾸면 매 카운트 변경마다 인터벌이 재설치되어 동작은 한다. 그래서 lint 규칙(`react-hooks/exhaustive-deps`)이 "effect 안에서 읽는 값은 전부 의존성에 넣으라"고 강제한다. **경고를 억지로 끄고 의존성을 빼먹는 것이 stale closure의 최다 발생 경로다.**

더 나은 해결책들 (상황에 따라 선택):

- **함수형 갱신**: `setCount(prev => prev + 1)` — 클로저의 `count`를 아예 읽지 않으므로 의존성이 필요 없다. 위 예시의 정석 해법.
- **의존성을 정직하게 채우기**: effect가 재실행되어도 문제없게 클린업을 제대로 작성.
- **useRef**: 최신 값을 ref에 계속 담아두고 콜백에서는 `ref.current`를 읽는다. ref는 렌더 스냅샷 밖에 있는 가변 상자이므로 항상 최신이다.

이벤트 핸들러에서도 같은 일이 생길 수 있다. 특히 [[Memoization]](`useCallback`)으로 함수를 캐싱하면서 의존성을 누락하면, 옛 state를 캡처한 함수가 계속 재사용된다. "캐싱 = 옛 클로저를 오래 살려두는 것"이므로 memoization과 stale closure는 한 세트로 이해해야 한다.

요약: stale closure는 언어 버그가 아니라 "렌더 = 스냅샷" 모델의 자연스러운 귀결이다. 의존성 배열을 정직하게 쓰고, 이전 값 기반 갱신은 함수형 갱신으로 해결하는 습관이 예방책이다.

## 🔗 관련
[[State]] · [[Hook]] · [[Re-render]] · [[Memoization]] · [[Props]]

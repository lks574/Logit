# State

> [!abstract] 한 줄 정의
> 컴포넌트가 소유하는, 시간에 따라 변하는 데이터. state가 바뀌면 React가 그 컴포넌트를 다시 렌더해서 UI를 새 값에 맞춘다.

> [!info] iOS/AOS로 치면
> SwiftUI의 `@State`, Compose의 `remember { mutableStateOf(...) }`. "이 값이 바뀌면 이 뷰를 다시 그려라"라고 프레임워크에 등록하는 지점이라는 점이 동일하다.

## 📖 설명

[[Props]]가 밖에서 주입되는 읽기 전용 입력이라면, state는 컴포넌트가 스스로 소유하고 변경하는 내부 데이터다. 함수 컴포넌트에서는 `useState` [[Hook]]으로 선언한다.

```jsx
function Counter() {
  const [count, setCount] = useState(0); // [현재값, 갱신함수]
  return <Button title={`count: ${count}`} onPress={() => setCount(count + 1)} />;
}
```

가장 중요한 멘탈모델: **`setCount`는 "값을 지금 바꾸는 명령"이 아니라 "새 값으로 컴포넌트 함수를 다시 실행해 달라는 예약"이다.** `setCount(1)`을 호출해도 지금 실행 중인 함수 안의 `count` 변수는 여전히 0이다. React가 이 예약을 처리하면서 컴포넌트 함수를 처음부터 다시 호출하고, 그때 `useState`가 새 값 1을 리턴한다. 즉 렌더 한 번 = 그 시점 state의 **스냅샷**이며, 변수가 mutate되는 게 아니라 함수 재실행으로 새 스냅샷이 만들어진다. 이걸 놓치면 [[Stale Closure]] 버그를 만나게 된다.

여기서 파생되는 실전 규칙들:

- **state를 직접 mutate하지 않는다.** `list.push(item)`이 아니라 `setList([...list, item])`처럼 **새 객체/배열**을 만들어 넘긴다. React는 참조 비교로 변경을 감지하기 때문에, 같은 객체를 고쳐 넣으면 리렌더가 일어나지 않는다. Compose의 `mutableStateListOf`처럼 mutation을 관찰하는 구조가 아니다.
- **갱신은 배치(batch)된다.** 한 이벤트 핸들러에서 `setA`, `setB`를 연달아 불러도 리렌더는 한 번이다. 이전 값 기반 갱신이 필요하면 `setCount(prev => prev + 1)` 함수형 갱신을 쓴다.
- **리렌더가 필요 없는 값은 state가 아니다.** 렌더 결과에 영향을 주지 않는 값(타이머 ID 등)은 `useRef`에 담는다. props에서 계산할 수 있는 값도 state로 복제하지 말고 렌더 중에 계산한다.

state의 **소유 위치**도 설계 포인트다. 두 컴포넌트가 같은 데이터를 봐야 하면 공통 부모로 state를 올리고(lifting state up) 각자에게 [[Props]]로 내려준다. 앱 전역 상태는 Context나 외부 스토어 라이브러리(Zustand, Redux 등)로 관리하는데, 원리는 같다 — "state 변경 → 구독하는 컴포넌트 [[Re-render]]".

SwiftUI와의 대응을 정리하면: `useState` ≈ `@State`, "state를 부모로 올리고 값+콜백을 내려주기" ≈ `@Binding`, Context ≈ `@Environment`. Compose로는 `remember { mutableStateOf }` / state hoisting / `CompositionLocal`이 각각 대응한다.

## 🔗 관련
[[Props]] · [[Hook]] · [[Re-render]] · [[Stale Closure]] · [[Reconciliation]]

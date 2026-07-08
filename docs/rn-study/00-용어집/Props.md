# Props

> [!abstract] 한 줄 정의
> 부모 컴포넌트가 자식 컴포넌트에 내려주는 입력값 묶음(properties). 자식 입장에서는 **읽기 전용**이며, 데이터는 항상 부모→자식 한 방향으로만 흐른다.

> [!info] iOS/AOS로 치면
> SwiftUI 뷰의 이니셜라이저 파라미터(`ProfileView(user: user)`), Compose 함수의 인자(`Profile(user = user)`). 정확히 같은 역할이다.

## 📖 설명

React 컴포넌트는 함수이고, props는 그 함수의 인자다. [[JSX]]에서 태그 속성처럼 쓴 것들이 하나의 객체로 묶여 전달된다.

```jsx
// 부모
<UserCard name="Kim" age={30} onPress={handlePress} />

// 자식 — 구조 분해(destructuring)로 받는 게 관례
function UserCard({ name, age, onPress }) {
  return <Text onPress={onPress}>{name} ({age})</Text>;
}
```

핵심 규칙 두 가지:

1. **읽기 전용(immutable)** — 자식이 받은 props를 수정하면 안 된다. 값을 바꾸고 싶으면 부모가 새 props로 다시 렌더해야 한다. SwiftUI 뷰가 `let` 프로퍼티를 못 바꾸는 것과 같다.
2. **단방향 데이터 흐름(one-way data flow)** — 데이터는 위에서 아래로만 흐른다. 자식이 부모에게 뭔가 알리고 싶으면 부모가 내려준 **콜백 함수를 호출**한다 (`onPress`, `onChangeText` 등). SwiftUI의 클로저 파라미터, Compose의 이벤트 람다(`onClick: () -> Unit`)와 동일한 패턴이다. SwiftUI의 `@Binding` 같은 양방향 축약 문법은 React에 없어서, "값 + 변경 콜백" 쌍을 명시적으로 내려주는 것이 관례다 (controlled component 패턴).

props가 바뀌면 (정확히는 부모가 리렌더되면) 자식 컴포넌트 함수도 다시 실행된다 → [[Re-render]]. "상태는 한 곳([[State]])이 소유하고, 나머지는 전부 props로 파생된다"는 것이 React 데이터 설계의 기본이며, 상태를 공통 부모로 올리는 것을 **lifting state up**이라 부른다.

특수한 props 몇 가지:

- `children` — 태그 사이에 넣은 내용이 자동으로 전달되는 예약 prop. SwiftUI의 트레일링 클로저 `@ViewBuilder content`, Compose의 `content: @Composable () -> Unit`에 해당한다. 컨테이너 컴포넌트를 만들 때 쓴다.
- `key` — 리스트 렌더링에서 형제 간 신원(identity)을 식별하는 특수 속성. 컴포넌트에게 전달되지 않고 React가 [[Reconciliation]]에 사용한다. SwiftUI `ForEach`의 `id:`와 같다.
- `style` — RN에서 뷰 스타일 객체를 받는 관례적 prop.

성능 관점에서 하나만 기억하면 된다: React는 기본적으로 props가 바뀌었는지 **얕은 비교조차 하지 않고** 부모가 리렌더되면 자식도 리렌더한다. 이를 막고 싶을 때 `React.memo`로 감싸는데, 이때는 props의 참조 동일성이 중요해진다 → [[Memoization]].

## 🔗 관련
[[State]] · [[JSX]] · [[Re-render]] · [[Reconciliation]] · [[Memoization]]

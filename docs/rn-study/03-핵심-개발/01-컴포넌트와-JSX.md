# 컴포넌트와 JSX

> RN의 UI 최소 단위는 "props를 받아 UI를 반환하는 함수"다 — SwiftUI `View` / Compose `@Composable`과 같은 자리에 있는 개념이며, 선언형 UI 경험자라면 절반은 이미 알고 시작하는 셈이다.

## iOS/AOS 대응 개념

| RN | iOS (SwiftUI) | iOS (UIKit) | Android (Compose) |
|---|---|---|---|
| 함수 컴포넌트 | `struct MyView: View` | `UIView` 서브클래스 | `@Composable fun MyView()` |
| [[JSX]] | `ViewBuilder` DSL (`body` 내부) | — (명령형 조립) | Composable 호출 트리 |
| [[Props]] | `View`의 `let` 프로퍼티, 이니셜라이저 인자 | 프로퍼티 + `configure()` | Composable 함수 파라미터 |
| `children` | `@ViewBuilder` 클로저 | `addSubview(_:)` | `content: @Composable () -> Unit` |
| `View` | `VStack`/`HStack`류 컨테이너, `UIView` 개념 | `UIView` | `Box`/`Column`/`Row` |
| `Text` | `Text` | `UILabel` | `Text` |
| `Image` | `Image`/`AsyncImage` | `UIImageView` | `Image`/Coil `AsyncImage` |
| `Pressable` | `Button` + 커스텀 스타일 | `UIButton`/`UITapGestureRecognizer` | `Modifier.clickable` |
| `ScrollView` | `ScrollView` | `UIScrollView` | `Modifier.verticalScroll` |
| `TextInput` | `TextField` | `UITextField`/`UITextView` | `TextField`/`BasicTextField` |

## 왜 이렇게 설계됐나

React는 2013년에 "UI = f(state)"라는 아이디어를 웹에 가져왔다. UI를 명령형으로 조작(=UIKit의 `label.text = ...`)하지 않고, **현재 상태에서 화면이 어떻게 생겨야 하는지를 매번 통째로 선언**하면, 프레임워크가 이전 선언과 비교([[Reconciliation]])해서 최소 변경만 실제 뷰에 반영한다. SwiftUI(2019)와 Compose(2019/2021)는 사실상 이 모델의 네이티브 재해석이다. 즉 **RN이 SwiftUI를 닮은 게 아니라 그 반대**이고, SwiftUI/Compose 경험자는 "선언형 사고 전환"이라는 가장 큰 허들을 이미 넘은 상태다.

[[JSX]]는 이 선언을 편하게 쓰기 위한 문법 설탕이다. XML처럼 보이지만 실제로는 함수 호출로 컴파일되는 JavaScript 표현식이며, 그래서 문자열 템플릿 언어와 달리 **일반 JS 로직(조건, 반복, 변수)을 그대로 섞어 쓸 수 있다**. SwiftUI의 `ViewBuilder`가 result builder라는 컴파일러 기능으로 DSL을 만든 것과 대칭되는 접근이다.

React Native는 여기에 한 가지를 더한다: [[JSX]]로 선언한 `<View>`는 웹의 `<div>`가 아니라 **진짜 네이티브 뷰**(iOS `UIView` 계열, Android `ViewGroup` 계열)로 마운트된다. RN 0.76+의 [[Fabric]] 렌더러가 [[Shadow Tree]]를 만들고 [[Yoga]]로 레이아웃을 계산해 네이티브 뷰 트리에 반영한다. "JS로 쓰지만 WebView가 아니다"가 RN의 정체성이다.

## 동작 원리

### 함수 컴포넌트

컴포넌트는 대문자로 시작하는 함수다. [[Props]]를 인자로 받고 [[JSX]]를 반환한다.

```tsx
function Greeting({ name }: { name: string }) {
  return <Text>Hello, {name}</Text>;
}

// 사용: <Greeting name="Logit" />
```

SwiftUI에서 `struct Greeting: View { let name: String; var body: some View { ... } }`를 쓰는 것과 1:1 대응. `body`가 곧 함수의 반환값이다. 컴포넌트 함수는 [[State]]가 바뀔 때마다 **처음부터 끝까지 다시 실행**되는데(자세한 건 [[02-상태와-렌더링]]), 이는 SwiftUI에서 상태 변경 시 `body`가 다시 평가되는 것과 같다.

### JSX 문법 3종 세트

**1. 표현식 삽입 `{}`** — 중괄호 안에는 어떤 JS *표현식*이든 들어간다 (문장 `if`/`for`는 불가).

```tsx
<Text>{user.name.toUpperCase()} — {items.length}건</Text>
```

**2. 조건부 렌더링** — `if`문을 못 쓰니 표현식으로 해결한다.

```tsx
{isLoading && <ActivityIndicator />}          {/* 조건 && 컴포넌트 */}
{error ? <ErrorView /> : <Content />}          {/* 삼항 */}
```

SwiftUI에서 `body` 안에 `if isLoading { ProgressView() }`를 쓰는 것과 같은 자리. Compose의 `if (isLoading) { CircularProgressIndicator() }`와도 같다. 단 `&&` 패턴에는 함정이 있다(아래 Pitfalls).

**3. 리스트: `map` + `key`** — 반복도 표현식으로. 배열의 각 원소를 JSX로 변환한다.

```tsx
{todos.map(todo => (
  <TodoRow key={todo.id} todo={todo} />
))}
```

`key`는 [[Reconciliation]]이 "이전 렌더의 어떤 항목이 이번 렌더의 어떤 항목인지" 추적하는 식별자다. SwiftUI `ForEach(todos, id: \.id)`의 `id`, Compose `LazyColumn`의 `key = { it.id }`와 정확히 같은 역할. 형제 사이에서 안정적이고 고유해야 한다.

### Props와 children

[[Props]]는 부모→자식 단방향으로 흐르는 읽기 전용 입력이다. 자식이 props를 수정할 수 없다는 점에서 SwiftUI의 `let` 프로퍼티와 같다. "이벤트는 위로, 데이터는 아래로" — 자식이 부모에게 알릴 일은 콜백 prop(`onPress` 등)으로 처리한다(SwiftUI에서 클로저를 넘기는 것과 동일).

`children`은 태그 사이에 끼워 넣은 내용이 담기는 특수 prop이다.

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// <Card><Text>내용</Text></Card>
```

SwiftUI의 `@ViewBuilder content: () -> Content`, Compose의 후행 람다 `content: @Composable () -> Unit`과 같은 패턴이다. "컨테이너 컴포넌트"를 만드는 표준 방법.

### 코어 컴포넌트

RN은 HTML 태그 대신 자체 코어 컴포넌트를 제공하고, 각각이 플랫폼 네이티브 뷰로 렌더된다. 실무에서 쓰는 것은 사실상 위 대응표의 6개가 전부에 가깝다.

- **`View`** — 레이아웃/스타일링의 기본 블록. 스스로는 아무것도 그리지 않는다.
- **`Text`** — 모든 텍스트는 반드시 이 안에. 중첩 가능(`<Text>안에 <Text style={...}>부분 강조</Text>도 됨` — `NSAttributedString` 스타일 상속과 유사).
- **`Image`** — `source={require('./local.png')}` 또는 `source={{ uri: 'https://…' }}`. 원격 이미지는 **크기를 명시해야** 보인다(아래 Pitfalls).
- **`Pressable`** — 터치 처리의 현대적 표준. `TouchableOpacity`류의 후속. pressed 상태를 함수형 style/children으로 받는다.
- **`ScrollView`** — 자식을 전부 렌더하는 스크롤 컨테이너. 항목이 많으면 [[FlatList]]로([[04-리스트-FlatList-FlashList]]).
- **`TextInput`** — `value` + `onChangeText`로 제어(controlled) 패턴을 쓰는 게 일반적.

### "Text 안에만 텍스트" 규칙

RN 특유의 강규칙: **문자열은 `<Text>` 내부에만 존재할 수 있다.** 웹에서는 `<div>hello</div>`가 되지만 RN에서 `<View>hello</View>`는 런타임 에러다("Text strings must be rendered within a <Text> component"). iOS에 텍스트를 스스로 그리는 `UIView`가 없고 `UILabel`이 따로 있는 것과 같은 이유 — RN의 `View`는 텍스트 렌더링 능력이 없는 순수 컨테이너다.

이 에러는 보통 직접 문자열을 쓸 때보다 **조건부 렌더링이 문자열/숫자를 흘렸을 때** 터진다(Pitfalls 참고).

## 코드 예시

RN 0.76+ / Expo SDK 57, TypeScript. 코어 컴포넌트 6종 + JSX 3종 세트를 한 화면에.

```tsx
import { useState } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet,
} from 'react-native';

type Todo = { id: string; title: string; done: boolean };

function TodoRow({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => onToggle(todo.id)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={todo.done ? styles.doneText : undefined}>
        {todo.done ? '✓ ' : ''}{todo.title}
      </Text>
    </Pressable>
  );
}

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', title: 'JSX 이해하기', done: true },
    { id: '2', title: 'Props 흘려보내기', done: false },
  ]);
  const [draft, setDraft] = useState('');

  const remaining = todos.filter(t => !t.done).length;

  const toggle = (id: string) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        style={styles.logo}
      />
      {/* 표현식 삽입 */}
      <Text style={styles.heading}>남은 할 일: {remaining}개</Text>

      {/* 조건부 렌더링 — 길이가 0"인지"를 boolean으로 만들어 && 사용 */}
      {todos.length === 0 && <Text>모두 끝!</Text>}

      {/* 리스트: map + key */}
      {todos.map(todo => (
        <TodoRow key={todo.id} todo={todo} onToggle={toggle} />
      ))}

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="새 할 일"
        onSubmitEditing={() => {
          if (!draft.trim()) return;
          setTodos(prev => [...prev, { id: String(Date.now()), title: draft, done: false }]);
          setDraft('');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  logo: { width: 48, height: 48 },
  heading: { fontSize: 18, fontWeight: '600' },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowPressed: { opacity: 0.5 },
  doneText: { textDecorationLine: 'line-through', color: '#888' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8 },
});
```

## 함정 (Pitfalls)

- **`&&`에 숫자를 넣으면 `0`이 화면에 렌더된다.** `{items.length && <List />}`에서 length가 0이면 JS의 `&&`는 `0`을 반환하고, RN은 `Text` 밖의 문자열/숫자를 만나 **크래시**한다(웹은 조용히 "0"을 그려서 더 못 찾는다). 항상 `items.length > 0 && ...`처럼 boolean으로 만들 것. SwiftUI의 `if`는 이런 함정이 없어서 네이티브 개발자가 특히 잘 걸린다.
- **`<View>` 안에 맨 문자열 금지.** 조건 분기 결과로 문자열이 새어 나와도 같은 에러. 공백 하나(`<View> </View>` 줄바꿈 후 표현식)로도 발생할 수 있다.
- **컴포넌트 이름은 대문자.** `<greeting />`은 컴포넌트가 아니라 네이티브 태그로 취급되어 실패한다. UIKit 클래스 명명과 무관한, JSX 컴파일러의 규칙이다.
- **`key`에 배열 index 쓰지 말 것.** 항목 삽입/삭제/정렬 시 [[Reconciliation]]이 항목을 오인해 [[State]]가 엉뚱한 행에 붙는다. SwiftUI에서 `ForEach(0..<items.count)`가 만드는 버그와 동일한 계열. 상세는 [[04-리스트-FlatList-FlashList]].
- **원격 `Image`는 크기 필수.** `require()`한 로컬 이미지는 크기를 아니까 자동이지만, `uri` 이미지는 `width`/`height` 스타일이 없으면 0×0으로 렌더된다. `UIImageView`의 intrinsic size에 익숙하면 당황하는 지점.
- **JSX는 정확히 하나의 루트를 반환.** 형제 여러 개를 반환하려면 Fragment(`<>...</>`)로 감싼다. SwiftUI `body`가 `some View` 하나를 요구하는 것과 같다(SwiftUI는 암묵적 `TupleView`로 감춰줄 뿐).
- **`style` 등 prop 이름은 camelCase, CSS와 다름.** `background-color`가 아니라 `backgroundColor`. 스타일 전반은 [[03-스타일링과-Flexbox]].
- **`Pressable` 클로저 스타일**: `style={({ pressed }) => ...}` 형태를 처음 보면 문법 에러로 오해하기 쉽다. "pressed 상태를 인자로 받는 함수도 style에 넣을 수 있다"는 API일 뿐이다.

## 관련 노트

[[JSX]] · [[Props]] · [[State]] · [[Reconciliation]] · [[Fabric]] · [[Shadow Tree]] · [[Yoga]] · 다음: [[02-상태와-렌더링]]

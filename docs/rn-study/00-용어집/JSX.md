# JSX

> [!abstract] 한 줄 정의
> JavaScript 코드 안에 HTML/XML처럼 생긴 마크업을 직접 쓸 수 있게 해주는 문법 확장(syntax extension). 브라우저나 [[Hermes]]가 직접 실행하는 게 아니라, 빌드 시점에 일반 함수 호출로 변환(트랜스파일)된다.

> [!info] iOS/AOS로 치면
> SwiftUI의 `ViewBuilder` DSL, Jetpack Compose의 `@Composable` 함수 본문. "UI를 선언형 코드로 기술한다"는 목적이 같다. 다만 SwiftUI/Compose는 언어(Swift/Kotlin) 자체 기능인 반면, JSX는 JS 표준이 아니라서 별도 변환 단계가 필요하다.

## 📖 설명

React 컴포넌트는 "이 상태일 때 UI가 어떻게 생겨야 하는가"를 리턴하는 함수다. UI 구조를 순수 JS로 쓰면 함수 호출이 깊게 중첩되어 읽기 어렵기 때문에, 마크업처럼 보이는 문법을 얹은 것이 JSX다.

```jsx
function Greeting({ name }) {
  return (
    <View style={styles.box}>
      <Text>Hello, {name}!</Text>
    </View>
  );
}
```

핵심은 **JSX가 문법 설탕(sugar)일 뿐**이라는 점이다. 위 코드는 트랜스파일러(Babel 등, RN에서는 [[Metro]]가 파이프라인에 포함)를 거치면 대략 `jsx(View, { style: styles.box, children: jsx(Text, ...) })` 같은 **함수 호출**로 바뀐다. 즉 `<View>`는 태그가 아니라 "View 컴포넌트를 인자로 받는 함수 호출"이고, 그 결과는 화면이 아니라 **엘리먼트(element)라는 가벼운 JS 객체**다. 실제 네이티브 뷰 생성은 이후 [[Reconciliation]]과 [[Fabric]] 렌더러가 담당한다.

이 "결국 JS 표현식"이라는 사실에서 JSX의 규칙들이 자연스럽게 나온다:

- 중괄호 `{}` 안에는 아무 JS 표현식이나 넣을 수 있다 (변수, 삼항연산자, `map()` 등).
- `if`문/`for`문은 표현식이 아니라서 JSX 안에 직접 못 쓴다. 삼항연산자나 `&&`, 배열 `map`을 쓴다.
- 하나의 리턴값이어야 하므로 루트 엘리먼트는 하나여야 한다 (여러 개면 `<>...</>` Fragment로 묶는다).
- 태그에 넘기는 속성들은 함수 인자 객체, 즉 [[Props]]가 된다.

SwiftUI와 비교하면: SwiftUI의 `body`도 결국 `VStack { Text(...) }`라는 함수/클로저 조합으로 뷰 트리 값을 만들어 리턴한다. Compose의 `@Composable` 함수 호출도 마찬가지다. 셋 다 "UI = 상태의 함수, 리턴값은 UI 기술(description)"이라는 선언형 모델을 공유한다. 차이점은 JSX는 대문자로 시작하면 커스텀 컴포넌트, 소문자면 내장 요소로 취급하는 관례가 있다는 것, 그리고 조건/반복이 언어 구문이 아니라 JS 표현식 조합으로 처리된다는 것 정도다.

React Native에서는 웹의 `<div>`, `<span>` 대신 `<View>`, `<Text>` 같은 RN 제공 컴포넌트를 쓴다. JSX 문법 자체는 웹 React와 완전히 동일하다.

## 🔗 관련
[[Props]] · [[State]] · [[Re-render]] · [[Reconciliation]] · [[Metro]]

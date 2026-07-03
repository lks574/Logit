# Worklet

**한 줄 정의**: [[Reanimated]]가 JS 스레드가 아닌 **UI 스레드의 별도 JS 런타임**에서 실행하는 작은 JS 함수. 매 프레임 돌아야 하는 애니메이션·제스처 코드를 담는 단위다.

**iOS/AOS로 치면**: "메인(UI) 스레드에서 실행되도록 마샬링되는 작은 클로저". `DispatchQueue.main`에 넘기는 클로저나 Choreographer 프레임 콜백에 비유할 수 있는데, 결정적 차이는 **다른 언어 런타임으로 복사되어 넘어가는 코드**라는 점이다.

## 설명

RN에서 JS는 기본적으로 한 스레드([[Hermes]] 런타임)에서 돈다. [[Reanimated]]는 부드러운 애니메이션을 위해 UI 스레드에 **두 번째 JS 런타임**을 하나 더 띄워 놓는데, 이 런타임에서 실행할 함수 조각이 worklet이다.

```js
const style = useAnimatedStyle(() => {
  'worklet'; // 지시어 (Reanimated 훅 안에서는 자동 처리됨)
  return { transform: [{ translateX: offset.value }] };
});
```

동작 원리: 빌드 시 Reanimated의 Babel 플러그인이 worklet 함수의 **코드와 캡처된 변수들을 직렬화**해서, 런타임에 UI 스레드 런타임으로 복사해 등록한다. 즉 같은 함수처럼 보여도 실행되는 곳은 완전히 다른 JS 세계다. shared value가 바뀌거나 제스처 이벤트가 오면 UI 스레드가 worklet을 직접 호출하므로, JS 스레드를 한 번도 거치지 않고 프레임마다 뷰를 갱신할 수 있다.

"별도 런타임에서 돈다"에서 나오는 제약들:

- **바깥 세계 접근 제한** — worklet은 자신이 캡처한 값의 **복사본**과 다른 worklet, shared value만 만질 수 있다. JS 스레드의 일반 함수를 그냥 호출할 수 없다.
- **JS 스레드로 돌아가려면 `runOnJS(fn)(args)`** — 애니메이션 완료 시 [[State]] 갱신, 내비게이션 호출, 콜백 실행처럼 React 세계를 건드리는 일은 반드시 이걸로 마샬링한다. 반대 방향(JS → UI 스레드)은 `runOnUI`.
- **캡처는 값 복사** — worklet 생성 시점의 값이 복사되므로, 이후 바뀌는 값을 보려면 shared value를 써야 한다. React의 [[Stale Closure]]와 닮은 함정이 여기에도 있는 셈이다.
- worklet 안에서 호출하는 함수도 worklet이어야 한다 (또는 순수 계산). console.log는 지원되지만 임의 모듈 접근은 안 된다.

네이티브 개발자용 멘탈모델: "UI 스레드에 상주하는 미니 JS 인터프리터가 있고, 거기에 프레임 단위 로직을 미리 배포(deploy)해 둔다. 두 세계는 shared value라는 스레드 세이프한 상자와 `runOnJS`/`runOnUI`라는 명시적 디스패치로만 통신한다." GCD로 스레드 간 클로저를 던지는 것과 비슷하지만, 던지는 것이 참조가 아니라 직렬화된 코드+데이터라는 점이 다르다.

worklet 개념은 Reanimated에서 출발해 범용화되고 있다 — 제스처 처리(react-native-gesture-handler), 스크롤 연동 애니메이션 등이 모두 이 메커니즘 위에 있고, worklet 런타임을 독립 패키지로 분리하는 작업도 진행되어 왔다 (현재 패키지 구성은 공식 문서 확인).

## 관련
[[Reanimated]] · [[JSI]] · [[Hermes]] · [[State]] · [[Stale Closure]]

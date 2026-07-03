# Reanimated

**한 줄 정의**: 애니메이션 로직을 JS 스레드가 아닌 **UI 스레드에서 실행**하는 RN 애니메이션 라이브러리 (react-native-reanimated). JS 스레드가 바빠도 애니메이션이 60fps로 끊기지 않는 것이 존재 이유다.

**iOS/AOS로 치면**: Core Animation(레이어 트리에 커밋하면 렌더 서버가 알아서 진행) / Android의 `ValueAnimator`·Compose 애니메이션 API에 해당하는 층. "애니메이션 진행을 앱 로직 스레드에서 분리한다"는 원리가 같다.

## 설명

RN 앱의 JS 코드는 단일 JS 스레드에서 돈다. 프레임마다 JS가 뷰 속성을 갱신하는 방식으로 애니메이션을 만들면, JS 스레드가 다른 일(네트워크 응답 파싱, [[Re-render]], 리스트 렌더)로 바쁜 순간 프레임이 떨어진다. 네이티브에서 메인 스레드를 막으면 UI가 버벅이는 것과 같은 문제 구조인데, RN은 스레드가 하나 더 있어서 "JS는 바쁜데 화면은 부드러워야 하는" 상황이 자주 생긴다.

Reanimated의 해법: 애니메이션 관련 코드를 [[Worklet]]이라는 작은 JS 함수로 표시하면, 라이브러리가 그것을 **UI 스레드의 별도 JS 런타임**으로 보내 실행한다. 매 프레임의 값 계산과 뷰 속성 반영이 전부 UI 스레드 안에서 끝나므로, JS 스레드가 완전히 멈춰 있어도 애니메이션과 제스처 반응이 유지된다. 이 스레드 간 통신은 [[JSI]] 기반이다.

핵심 API 구성:

- **`useSharedValue(0)`** — 양쪽 스레드에서 읽고 쓸 수 있는 값 상자. 애니메이션의 상태. `.value`로 접근하며, 갱신해도 React [[Re-render]]를 일으키지 않는다 (그게 핵심 성능 포인트).
- **`useAnimatedStyle(worklet)`** — shared value를 읽어 스타일 객체를 리턴하는 [[Worklet]]. 값이 바뀔 때마다 UI 스레드에서 재계산되어 뷰에 반영된다.
- **`withTiming` / `withSpring` / `withDecay`** — 값을 목표치까지 시간/물리 기반으로 진행시키는 애니메이션 드라이버. `sv.value = withSpring(100)`처럼 대입한다.
- **제스처 연동** — react-native-gesture-handler와 결합하면 터치 이벤트 처리까지 UI 스레드 worklet에서 하므로, 드래그 추적처럼 손가락에 붙어야 하는 인터랙션이 JS 부하와 무관하게 매끈하다.

Core Animation과의 비교가 이해에 좋다: CA는 "시작·끝·커브를 커밋하면 렌더 서버가 진행"하는 선언 모델이라 진행 중 개입이 제한적이다. Reanimated는 매 프레임 실제 JS(worklet) 코드가 UI 스레드에서 돌기 때문에, 제스처 값에 따른 임의 계산·조건 분기 같은 **인터랙티브 애니메이션**을 자유롭게 쓸 수 있으면서도 스레드 격리는 유지한다.

RN 코어에도 `Animated` API가 내장되어 있고 `useNativeDriver` 옵션으로 일부를 네이티브에서 돌릴 수 있지만, 지원 속성 제한 등으로 커뮤니티 표준은 Reanimated로 수렴했다. 레이아웃 전환 애니메이션(entering/exiting/layout) 같은 고수준 기능도 제공한다. Expo SDK에 버전이 맞춰 포함되므로 Expo 프로젝트에서는 SDK가 지정하는 버전을 쓰면 된다.

주의: worklet 안의 코드는 별도 런타임에서 돌므로 바깥 JS 세계를 자유롭게 호출할 수 없다. 제약과 탈출구(`runOnJS`)는 [[Worklet]] 노트 참고.

전형적인 사용 예 — 드래그로 카드를 옮기는 코드 골격:

```jsx
const offset = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
// 제스처 종료 시: offset.value = withSpring(0);
<Animated.View style={style} />
```

`offset.value` 대입부터 스프링 진행, 스타일 반영까지 전 과정이 UI 스레드에서 일어난다. React 렌더 사이클과 분리된 "값 → 스타일" 전용 파이프라인이라고 이해하면 된다.

## 관련
[[Worklet]] · [[JSI]] · [[Re-render]] · [[Fabric]] · [[React Navigation]]

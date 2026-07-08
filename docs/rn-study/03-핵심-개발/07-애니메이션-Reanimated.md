# 07. 애니메이션 — Reanimated

> [!abstract] 한 줄 요약
> RN의 JS 스레드는 애니메이션 프레임을 보장하지 못한다. [[Reanimated]]는 애니메이션 로직 자체를 UI 스레드로 옮겨([[Worklet]]) 60fps를 지키는, 사실상의 표준 애니메이션 라이브러리다.

## 🔁 iOS/AOS 대응 개념

| RN | iOS | Android |
|---|---|---|
| 내장 `Animated` + `useNativeDriver` | `UIView.animate` (제한적 유사) | `ViewPropertyAnimator` |
| [[Reanimated]] shared value | `CADisplayLink`로 직접 구동하는 값 / Core Animation 레이어 값 | Compose `Animatable` / `ValueAnimator` |
| `useAnimatedStyle` | 레이어 프로퍼티 바인딩 | Compose에서 state → modifier 재구성 |
| `withTiming` / `withSpring` | `CABasicAnimation` / `CASpringAnimation`, SwiftUI `.easeInOut` / `.spring()` | `tween()` / `spring()` (Compose) |
| Layout Animation (`entering`/`exiting`) | SwiftUI `.transition(.opacity)` 등 | Compose `AnimatedVisibility` |
| [[Worklet]] (UI 스레드 JS 실행) | (직접 대응 없음 — 메인 스레드에서 그냥 실행하면 됨) | (직접 대응 없음) |

마지막 줄이 핵심이다. 네이티브에서는 "애니메이션 코드를 어느 스레드에서 돌릴까"를 고민할 필요가 없었다. RN에서는 그것이 첫 번째 질문이다.

## 🧭 왜 이렇게 설계됐나

### 문제: JS 스레드는 바쁘다

[[02-스레드-모델|스레드 모델]] 노트에서 본 내용을 떠올리자. RN 앱에는 UI(메인) 스레드와 JS 스레드가 있고, React 로직·비즈니스 로직·이벤트 핸들링이 전부 JS 스레드에서 돈다. `setState`를 16ms마다 호출해서 애니메이션을 만들면:

1. 매 프레임 JS에서 [[Re-render]] → 스타일 계산 → UI 스레드로 커밋
2. JS 스레드가 다른 일(리스트 렌더, 네트워크 응답 파싱)로 막히는 순간 **프레임 드랍**

Core Animation과 대비하면 명확하다. iOS에서 `UIView.animate`는 시작/끝 값을 **레이어 트리에 커밋**하면 이후 매 프레임 보간은 앱 프로세스 밖의 렌더 서버가 수행한다 — 메인 스레드가 멈춰도 애니메이션은 돈다. RN의 JS 주도 애니메이션에는 그런 안전망이 없다.

### 1차 해법: 내장 `Animated` + `useNativeDriver`

내장 `Animated` API는 애니메이션의 "선언"(시작값, 끝값, 커브)을 네이티브로 넘겨 UI 스레드에서 구동하는 `useNativeDriver: true` 옵션을 제공했다. Core Animation의 "커밋하면 알아서" 모델과 유사한 발상이다. 하지만 한계가 컸다:

- **`transform`과 `opacity`만 지원.** `width`, `height`, 색상 등 레이아웃/페인트 속성은 불가.
- 제스처 값에 따라 **매 프레임 계산이 필요한 인터랙티브 애니메이션**(드래그 추적, 스크롤 연동)은 결국 JS를 거쳐야 했다.

### 2차 해법: [[Reanimated]] — "계산 자체를 UI 스레드로"

Reanimated의 발상은 선언만 넘기는 게 아니라 **JS 함수를 UI 스레드에서 실행**하는 것이다. UI 스레드에 두 번째 소형 JS 런타임을 띄우고, `'worklet'`으로 표시된 함수를 거기서 돌린다. 제스처 이벤트 수신 → 스타일 계산 → 뷰 업데이트가 전부 UI 스레드 안에서 끝나므로 JS 스레드가 아무리 바빠도 60fps가 유지된다. 이 구조는 [[JSI]]/[[New Architecture]] 위에서 동기 통신으로 구현된다.

버전 참고: Expo SDK 57(RN 0.76+, [[New Architecture]]) 기준 Reanimated 3 이상이 표준이며, Reanimated 4부터는 worklet 런타임이 별도 패키지(`react-native-worklets`)로 분리되고 CSS 스타일 전환 API가 추가됐다 — 설치 시 SDK가 지정하는 버전과 공식 문서 확인.

## ⚙️ 동작 원리

### 기본 4종 세트

| API | 역할 |
|---|---|
| `useSharedValue(x)` | 두 스레드에서 읽고 쓸 수 있는 애니메이션 값. `.value`로 접근. React [[State]]가 **아니며**, 바뀌어도 리렌더를 일으키지 않는다 |
| `useAnimatedStyle(fn)` | shared value → 스타일 객체를 만드는 [[Worklet]]. 의존하는 shared value가 바뀔 때마다 **UI 스레드에서** 재실행되어 뷰에 직접 반영 |
| `withTiming(to, config)` | 시간 기반 보간 (duration + easing) — `CABasicAnimation` 대응 |
| `withSpring(to, config)` | 물리 스프링 — `CASpringAnimation` / SwiftUI `.spring()` 대응 |

흐름: `sv.value = withTiming(100)` 라고 **대입**하면, UI 스레드의 애니메이션 드라이버가 매 프레임 값을 갱신하고, 그 값을 구독하는 `useAnimatedStyle`이 UI 스레드에서 재계산되어 뷰에 적용된다. React 렌더 사이클을 완전히 우회한다.

### Worklet이란

```typescript
function half(x: number): number {
  'worklet'; // 이 함수는 UI 스레드 런타임에서도 실행 가능
  return x / 2;
}
```

- `'worklet'` 지시어가 붙은 함수는 빌드 시 Babel 플러그인이 추출해 UI 런타임에 설치한다.
- `useAnimatedStyle`, 제스처 콜백 등에 넘기는 함수는 **자동으로 workletize**되므로 지시어를 직접 쓸 일은 헬퍼 함수를 만들 때 정도다.
- worklet이 바깥 스코프의 값을 참조하면 그 값은 **복사되어 캡처**된다(참조 공유가 아님). 일반 JS 함수는 UI 런타임에 존재하지 않으므로 worklet 안에서 직접 호출할 수 없고, JS 스레드로 되돌아가려면 `runOnJS(fn)(args)`를 써야 한다.

### 조합 헬퍼와 파생 값

기본 4종 위에 자주 쓰는 도구들:

| API | 역할 | 네이티브 감각 대응 |
|---|---|---|
| `withDelay(ms, anim)` | 지연 후 시작 | `CAAnimation.beginTime` / `delay:` |
| `withSequence(a, b, ...)` | 순차 실행 | `CAAnimationGroup` 수동 체이닝, SwiftUI 단계별 `withAnimation` |
| `withRepeat(anim, n, reverse)` | 반복(왕복 포함) | `repeatCount` + `autoreverses` |
| `interpolate(v, [0,1], [0,300])` | 입력 범위 → 출력 범위 매핑 | 진행률 기반 수동 보간 |
| `useDerivedValue(fn)` | 다른 shared value에서 파생된 shared value | Combine의 `map` / Flow의 `map` |
| `runOnJS(fn)` | worklet에서 JS 스레드 함수 호출 | `DispatchQueue.main.async`의 방향 반대 버전 |

```typescript
// 진행률 하나로 여러 속성을 구동하는 관용구
const progress = useSharedValue(0); // 0 → 1
const style = useAnimatedStyle(() => ({
  opacity: progress.value,
  transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
}));
// progress.value = withTiming(1, { duration: 300 });
```

"진행률 shared value 하나 + `interpolate`로 부채살처럼 펼치기"는 스크롤 연동 헤더, 바텀시트 등 거의 모든 복합 애니메이션의 뼈대 패턴이다.

### Layout Animation — entering / exiting

컴포넌트가 마운트/언마운트될 때의 전환을 선언 한 줄로 처리한다. SwiftUI의 `.transition`, Compose의 `AnimatedVisibility`에 해당.

```tsx
<Animated.View entering={FadeInDown} exiting={FadeOut} />
```

조건부 렌더로 뷰가 사라질 때도 exiting 애니메이션이 끝날 때까지 뷰를 잡아뒀다가 제거해 준다 — 네이티브에서 손으로 하던 "애니메이션 끝나고 removeFromSuperview" 처리를 대신하는 것.

## 💻 코드 예시

기준: RN 0.76+ / Expo SDK 57 / react-native-reanimated 3+ (`npx expo install react-native-reanimated`).

```typescript
// FadeScaleBox.tsx — 탭하면 스프링으로 커졌다 돌아오는 박스
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function FadeScaleBox() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // worklet (자동 workletize) — UI 스레드에서 실행됨
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPress = () => {
    // 대입 = 애니메이션 시작. React 렌더를 거치지 않는다.
    scale.value = withSpring(1.3, { damping: 12 }, (finished) => {
      'worklet';
      if (finished) scale.value = withSpring(1);
    });
    opacity.value = withTiming(0.6, { duration: 150 }, () => {
      'worklet';
      opacity.value = withTiming(1, { duration: 150 });
    });
  };

  return (
    <View style={styles.center}>
      <Pressable onPress={onPress}>
        <Animated.View
          entering={FadeInDown.duration(400)} // Layout Animation
          style={[styles.box, animatedStyle]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  box: { width: 120, height: 120, borderRadius: 16, backgroundColor: '#4f8ef7' },
});
```

포인트:

- `Animated.View`를 써야 한다. 일반 `View`에 animatedStyle을 넘기면 동작하지 않는다.
- `scale.value = withSpring(...)` — 값 "대입"이 곧 애니메이션 트리거. SwiftUI의 `withAnimation { state = newValue }`와 발상이 비슷하지만, 여기서는 리렌더가 전혀 일어나지 않는다는 점이 다르다.
- `withSpring`의 세 번째 인자(완료 콜백)는 UI 스레드에서 불리므로 worklet이어야 하고, 여기서 JS 함수를 부르려면 `runOnJS`가 필요하다.

## ⚠️ 함정 (Pitfalls)

1. **shared value를 [[State]]처럼 렌더에서 읽기** — `<Text>{scale.value}</Text>`는 최초 값만 보이고 갱신되지 않는다. shared value 변경은 [[Re-render]]를 일으키지 않기 때문. 화면 텍스트로 보여야 하면 `useAnimatedProps` + `TextInput` 패턴이나 `useDerivedValue` + `runOnJS`로 state에 반영(공식 문서의 "Animating text" 참고).
2. **worklet 안에서 일반 JS 함수 호출** — `useAnimatedStyle` 안에서 컴포넌트 스코프의 일반 함수를 부르면 크래시하거나 에러("Tried to synchronously call a non-worklet function on the UI thread"). 헬퍼에 `'worklet'`을 붙이거나, JS 사이드 이펙트(내비게이션, setState, 햅틱)는 `runOnJS(fn)(args)`로 넘길 것.
3. **캡처는 복사다** — worklet이 바깥 변수를 캡처하는 시점의 값이 복사된다. JS 쪽에서 그 변수를 나중에 바꿔도 worklet은 모른다. 두 스레드가 공유해야 하는 값은 반드시 shared value로.
4. **`useAnimatedStyle` 안에서 `.value` 대입** — 스타일 worklet은 "읽기 전용 계산"이어야 한다. 안에서 shared value를 쓰면 무한 루프 위험. 파생 값은 `useDerivedValue`로.
5. **매 프레임 `setState`로 애니메이션 구현** — 네이티브 습관(`CADisplayLink`/`Choreographer` 콜백에서 값 갱신)을 그대로 가져오면 JS 스레드 애니메이션이 된다. RN에서 그 역할은 shared value + worklet의 몫이다.
6. **인라인 스타일 객체에 shared value 직접 삽입** — `style={{ opacity: sv.value }}`는 렌더 시점 스냅샷일 뿐이다. 반드시 `useAnimatedStyle`을 거칠 것.
7. **Babel 플러그인 누락** — bare RN에서는 `react-native-reanimated/plugin`을 babel 설정 마지막에 넣어야 한다. Expo는 `babel-preset-expo`가 처리해 주지만, 커스텀 babel.config.js를 만들다 preset을 날리면 같은 문제가 생긴다. 증상: "native part of Reanimated doesn't seem to be initialized" 계열 에러.
8. **dev 빌드 성능으로 판단** — 개발 모드는 JS가 훨씬 느려서, JS 주도 애니메이션의 프레임 드랍이 과장되어 보이고 반대로 "release에선 괜찮겠지"라는 오판도 낳는다. 애니메이션 품질 판단은 release 빌드 + 실기기에서. (Xcode Instruments / Android GPU 프로파일링 감각 그대로.)

한 줄 정리: **선언(무엇으로 변할지)은 JS에서, 실행(매 프레임)은 UI 스레드에서.** Core Animation이 렌더 서버에 맡기듯, Reanimated는 UI 런타임의 worklet에 맡긴다.

## 🔗 관련 노트

[[Worklet]] · [[JSI]] · [[New Architecture]] · [[Fabric]] · [[Re-render]] · [[State]] · 이전: [[06-상태관리]] · 다음: [[08-제스처]] (pan + shared value가 표준 콤보)

# 스타일링과 Flexbox

> [!abstract] 한 줄 요약
> RN 스타일은 CSS처럼 생긴 JS 객체이고 레이아웃은 [[Yoga]]가 계산하는 Flexbox다 — Auto Layout의 "제약 방정식" 사고를 버리고 "부모가 자식을 흘려보내는 플로우" 사고로 갈아타는 것이 핵심.

## 🔁 iOS/AOS 대응 개념

| RN | iOS | Android |
|---|---|---|
| `style` prop + JS 객체 | SwiftUI modifier 체인 | Compose `Modifier` |
| `StyleSheet.create` | — (개념상 스타일 상수 모음) | `styles.xml` 비슷하나 정적 XML 아님 |
| Flexbox (`flexDirection: 'column'`) | `VStack` | `Column` |
| `flexDirection: 'row'` | `HStack` | `Row` |
| 절대 배치 (`position: 'absolute'`) | `ZStack` + `offset`/frame | `Box` + `Modifier.offset` |
| `flex: 1` | `Spacer()` / `frame(maxHeight: .infinity)` | `Modifier.weight(1f)` |
| 단위 없는 숫자 (dp) | pt (포인트) | dp |
| `useColorScheme()` | `@Environment(\.colorScheme)` | `isSystemInDarkTheme()` |
| — (제약 없음) | Auto Layout `NSLayoutConstraint` | `ConstraintLayout` |

## 🧭 왜 이렇게 설계됐나

RN은 "웹 개발자가 이미 아는 레이아웃 언어"로 Flexbox를 채택했고, 이를 네이티브에서 돌리기 위해 C++로 구현한 것이 [[Yoga]]다. JS 스레드에서 선언한 스타일은 [[Fabric]]의 [[Shadow Tree]] 노드에 붙고, Yoga가 백그라운드에서 각 노드의 최종 frame(x, y, width, height)을 계산해 네이티브 뷰에 적용한다. 즉 **Auto Layout도 Compose 측정 패스도 아닌, 제3의 레이아웃 엔진이 양 플랫폼에서 동일하게 돈다** — 이것이 "한 번 작성, 두 플랫폼 동일 레이아웃"의 실체이자, 플랫폼 레이아웃 지식이 직접 통하지 않는 이유다.

CSS 전체가 아니라 부분집합만 지원하는 것도 의도적이다. cascade(상속 계단)가 없어서 "이 스타일이 어디서 왔지?"를 추적할 일이 없고, 스타일은 그냥 컴포넌트에 붙은 JS 객체라 변수·조건·함수로 조합한다. SwiftUI modifier가 뷰에 지역적으로 붙는 것과 같은 지역성이다.

## ⚙️ 동작 원리

### 스타일 3형태

```tsx
import { StyleSheet, View, Text } from 'react-native';

// 1. StyleSheet.create — 표준. 컴포넌트 밖에 정의(렌더마다 재생성 방지), 타입 검증.
const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: 'white' },
  title: { fontSize: 17, fontWeight: '600' },
});

// 2. 인라인 — 동적 값에. 매 렌더 새 객체가 만들어짐.
<View style={{ opacity: pressed ? 0.5 : 1 }} />

// 3. 배열 병합 — 뒤가 앞을 덮어쓴다. false/null/undefined는 무시.
<Text style={[styles.title, isError && { color: 'red' }]} />
```

배열 병합이 실무의 주력 패턴이다: `[기본, 조건 && 오버라이드, props.style]` — 마지막에 호출자 스타일을 받아 컴포넌트를 커스터마이즈 가능하게 만든다. SwiftUI에서 modifier를 나중에 붙일수록 우선하는 것과 유사한 "나중 것이 이긴다" 규칙.

`StyleSheet.create`는 과거엔 성능 최적화 의미가 컸지만 현재는 주로 **타입 체크 + 조직화** 가치다. 인라인이 죄악은 아니고, 매 렌더 새 객체가 [[Memoization]]된 자식의 props 비교를 깨는 경우만 조심하면 된다.

### 단위 없는 숫자 = 밀도 독립 픽셀

`width: 100`의 100은 iOS의 pt, Android의 dp에 해당하는 **밀도 독립 단위**다. 물리 픽셀로 변환은 RN이 알아서 한다(`PixelRatio` API로 접근 가능). `%` 문자열(`width: '50%'`)도 일부 속성에서 지원. `em`/`rem` 같은 웹 단위는 없다.

### Flexbox — 웹과 다른 기본값 2개

RN Flexbox에서 **가장 먼저 외울 것**:

| 속성 | 웹 기본값 | RN 기본값 |
|---|---|---|
| `flexDirection` | `row` | **`column`** |
| `alignItems` | `stretch` | `stretch` (동일) |
| `flexShrink` | `1` | **`0`** |
| `position` | `static` | `relative` |

- **기본이 column**: 아무 스타일 없는 `View`는 자식을 세로로 쌓는다 — 즉 기본이 `VStack`/`Column`이다. 모바일 화면이 세로라서 내린 결정.
- **alignItems 기본 stretch**: 교차축 크기를 안 주면 자식이 교차축으로 **꽉 늘어난다**. "왜 이 뷰가 가로로 꽉 차지?"의 90%가 이것.
- **flexShrink 기본 0**: 웹과 달리 자식이 넘쳐도 기본으로는 줄어들지 않는다 → 텍스트가 화면 밖으로 나가는 고전 버그(Pitfalls 참고).

### 주축과 교차축

- `justifyContent` — **주축**(flexDirection 방향) 정렬: `flex-start`(기본) / `center` / `flex-end` / `space-between` / `space-around` / `space-evenly`
- `alignItems` — **교차축** 정렬: `stretch`(기본) / `flex-start` / `center` / `flex-end` / `baseline`
- `alignSelf` — 자식 하나만 교차축 정렬 오버라이드
- `gap` (+ `rowGap`/`columnGap`) — 자식 사이 간격. margin 나열보다 이것부터. SwiftUI `VStack(spacing:)` / Compose `Arrangement.spacedBy`와 같다.

`flexDirection`이 바뀌면 두 속성의 방향도 같이 돈다: `row`에서 `justifyContent`는 가로, `column`에서는 세로.

### flex / flexGrow / flexShrink

- `flex: 1` — "부모가 주축으로 남긴 공간을 채워라". 형제끼리 `flex: 2`, `flex: 1`이면 2:1 분할. `Modifier.weight`와 동일.
- `flexGrow` — 남는 공간을 얼마나 가져갈지, `flexShrink` — 모자랄 때 얼마나 양보할지, `flexBasis` — 분배 전 기본 크기.
- RN의 `flex: 1`은 대략 `flexGrow: 1, flexShrink: 1, flexBasis: 0`으로 동작한다. 대부분은 `flex: 1`만으로 충분하다.

### Auto Layout 사고 → Flexbox 사고 전환

Auto Layout은 "뷰 간 관계를 제약 방정식으로 선언 → 솔버가 푼다"(어느 뷰든 어느 뷰와도 관계 가능). Flexbox는 **부모→자식 단방향 플로우**다: 컨테이너가 방향을 정하고, 자식은 그 흐름 안에서 크기를 협상한다. 형제를 넘어 임의 뷰에 "맞추는" 제약은 없다 — 그런 관계가 필요하면 **컨테이너 중첩으로 구조를 바꿔서** 표현한다. SwiftUI로 이미 이 전환을 했다면 (Stack 중첩으로 사고하기) 그대로 통한다.

자주 쓰는 패턴 대응표:

| 하고 싶은 것 | Auto Layout | RN Flexbox |
|---|---|---|
| 정중앙 배치 | centerX + centerY 제약 | 부모에 `flex: 1, justifyContent: 'center', alignItems: 'center'` |
| 하단 고정 버튼 | bottom anchor 제약 | 콘텐츠에 `flex: 1`, 버튼은 그 아래 형제 (또는 `marginTop: 'auto'`) |
| 좌우 양끝 배치 | leading/trailing 제약 | `flexDirection: 'row', justifyContent: 'space-between'` |
| 2:1 비율 분할 | multiplier 제약 | 형제에 `flex: 2` / `flex: 1` |
| 부모에 꽉 채우기 | 4변 pin | `flex: 1` (또는 `StyleSheet.absoluteFill`) |
| 우상단 배지 오버레이 | 겹친 뷰 + 제약 | 자식에 `position: 'absolute', top: 8, right: 8` |
| 고정 크기 | width/height 제약 | `width: 48, height: 48` |

`position: 'absolute'`는 플로우에서 이탈해 **가장 가까운 부모 기준** 좌표로 배치된다(웹의 "positioned ancestor 탐색"과 달리 항상 직계 부모 기준). `ZStack` 대체물이다.

### 다크모드 / 동적 스타일

스타일이 그냥 JS 값이므로 동적 스타일 = 조건부 값이다.

```tsx
import { useColorScheme } from 'react-native';

const scheme = useColorScheme(); // 'light' | 'dark' | null — 변경 시 리렌더
<View style={[styles.card, scheme === 'dark' && styles.cardDark]} />
```

실전에서는 색을 직접 분기하기보다 **테마 객체를 Context로 내려주고** (이 레포 Logit도 디자인 토큰 방식) 컴포넌트는 토큰만 참조하는 구조가 일반적. 시스템 폰트 크기 대응은 `Text`의 `allowFontScaling`(기본 true)과 `maxFontSizeMultiplier`로 조절한다.

## 💻 코드 예시

RN 0.76+ / TypeScript. "하단 고정 + 중앙 정렬 + row 분할 + 절대 배치 배지"를 한 화면에.

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

export default function LayoutPlayground() {
  const dark = useColorScheme() === 'dark';

  return (
    <View style={[styles.screen, dark && styles.screenDark]}>
      {/* 콘텐츠 영역: 남는 공간 전부 + 정중앙 정렬 */}
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar} />
          {/* 절대 배치 배지 — 부모(avatarWrap) 기준 */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </View>
        <Text style={[styles.title, dark && styles.titleDark]}>Flexbox Playground</Text>
      </View>

      {/* 좌우 양끝 row + 2:1 비율 버튼 */}
      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.primary, { flex: 2 }]}>
          <Text style={styles.btnText}>저장</Text>
        </Pressable>
        <Pressable style={[styles.btn, { flex: 1 }]}>
          <Text>취소</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },              // 기본 flexDirection: 'column'
  screenDark: { backgroundColor: '#111' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 80, height: 80 },          // 배지의 기준 좌표계
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: 'tomato', alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '600' },
  titleDark: { color: 'white' },
  row: { flexDirection: 'row', gap: 12 },         // 버튼 사이 간격은 gap으로
  btn: {
    height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#eee',
  },
  primary: { backgroundColor: '#4a7dff' },
  btnText: { color: 'white', fontWeight: '600' },
});
```

## ⚠️ 함정 (Pitfalls)

- **텍스트가 화면 밖으로 흘러 나감**: `row` 컨테이너 안 `Text`가 길면 웹과 달리 줄바꿈되지 않고 삐져나간다(`flexShrink` 기본 0). 텍스트(또는 그 부모)에 `flex: 1` 혹은 `flexShrink: 1`을 준다.
- **`flex: 1`을 줬는데 안 보임/0높이**: 부모 체인 중 하나라도 높이가 결정되지 않으면 `flex: 1`은 "0의 100%"가 된다. 루트부터 `flex: 1`이 이어지는지 확인. Auto Layout의 ambiguous layout에 해당하는 상황인데, RN은 경고 없이 그냥 0으로 그린다.
- **`alignItems: 'stretch'` 기본값 미인지**: 자식에 `width`를 안 줬는데 가로로 꽉 차면 이것. 자식에 `alignSelf: 'flex-start'`나 명시적 크기.
- **`justifyContent`와 `alignItems` 축 혼동**: "가로/세로"가 아니라 "주축/교차축"이다. `flexDirection`을 바꾸면 둘의 방향이 같이 돈다.
- **CSS 지식 과신**: `display: grid` 없음, `float` 없음, `z-index`는 형제간에만 의미, 스타일 상속은 `Text` 중첩 등 극히 일부만. shorthand도 다르다 — `margin: '8 16'` 같은 문자열 불가, `marginHorizontal`/`marginVertical`/`paddingHorizontal`을 쓴다.
- **그림자**: iOS는 `shadowColor/shadowOffset/shadowOpacity/shadowRadius`, Android는 `elevation`으로 서로 다르게 줘야 한다. RN 0.76+에 크로스 플랫폼 `boxShadow`가 추가되었으니 New Architecture라면 그것도 선택지 — 세부는 공식 문서 확인.
- **인라인 스타일 객체가 `React.memo`를 무력화**: 매 렌더 새 참조라 얕은 비교가 항상 실패한다. 정적 부분은 `StyleSheet.create`로 빼고 동적 부분만 인라인으로.
- **숫자에 단위 문자열 붙이기**: `width: '100px'`는 에러. 숫자 그대로(`width: 100`).
- **`margin: 'auto'` 의존 금지**: 일부 동작하지만(주축 남는 공간 흡수) 웹의 중앙 정렬 관용구를 그대로 기대하지 말고 `justifyContent`/`alignItems`로 푸는 게 안전하다.

## 🔗 관련 노트

[[Yoga]] · [[Fabric]] · [[Shadow Tree]] · [[Memoization]] · 이전: [[02-상태와-렌더링]] · 다음: [[04-리스트-FlatList-FlashList]]

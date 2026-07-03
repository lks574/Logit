# 리스트 — FlatList와 FlashList

> ScrollView는 전부 렌더, [[FlatList]]는 보이는 것만 마운트하는 가상화 — 단 RecyclerView처럼 셀을 "재활용"하는 게 아니라 마운트/언마운트하며, 진짜 재활용이 필요하면 FlashList를 쓴다.

## iOS/AOS 대응 개념

| RN | iOS | Android |
|---|---|---|
| `ScrollView` | `UIScrollView` (자식 전부 생성) / SwiftUI `ScrollView`+`VStack` | `ScrollView`+`Column` |
| [[FlatList]] | `UITableView`/`UICollectionView` 자리 (동작은 다름) / SwiftUI `List`, `LazyVStack` | `RecyclerView` 자리 / Compose `LazyColumn` |
| FlashList (Shopify) | 셀 재활용까지 하는 진짜 `UICollectionView`류 | 진짜 `RecyclerView`류 |
| `renderItem` | `cellForRowAt` / `List` row 클로저 | `onBindViewHolder` / `items {}` 람다 |
| `keyExtractor` | `ForEach(id:)` / diffable data source의 identifier | `LazyColumn`의 `key = {}` |
| `SectionList` | grouped `UITableView` | sticky header 붙은 리스트 |
| `React.memo`한 항목 컴포넌트 | 셀 prepareForReuse 최적화 감각에 대응 | `@Stable` 파라미터로 skip 유도 |

## 왜 이렇게 설계됐나

모바일 리스트의 역사는 "수천 개 항목을 어떻게 메모리에 다 안 올리고 그리나"의 역사다. UIKit/Android의 답은 **셀 재활용**(화면 밖으로 나간 셀 객체를 새 데이터로 재구성). React의 답은 원래 "그냥 다 렌더"였는데 모바일에서는 불가능하므로, RN은 **가상화(virtualization)**를 얹었다: 화면 근처(window) 항목만 React 컴포넌트로 마운트하고, 멀어지면 언마운트한다. React의 선언형 모델(컴포넌트 = 상태의 함수)을 유지하면서 메모리를 억제하는 절충안이다.

그러나 마운트/언마운트는 재활용보다 비싸다 — 빠르게 스크롤하면 컴포넌트 생성·[[Yoga]] 레이아웃·네이티브 뷰 생성이 스크롤 속도를 못 따라가 **빈 화면(blank cell)**이 보인다. Shopify의 FlashList는 이 지점을 공략했다: 화면 밖 항목의 **네이티브 뷰를 파괴하지 않고 새 데이터로 재활용**해서(RecyclerView와 같은 전략) 같은 API 모양으로 훨씬 나은 스크롤 성능을 낸다. FlashList v2는 New Architecture([[Fabric]]) 전용으로 재작성되었고, 현재 생태계에서 "리스트는 기본으로 FlashList"가 통용되는 흐름이다.

## 동작 원리

### ScrollView vs FlatList

```
ScrollView: [1][2][3][4][5]...[1000]  ← 1000개 전부 마운트. 메모리·초기 렌더 폭발
FlatList:      ...[8][9][10][11]...   ← 뷰포트 ± window 범위만 마운트, 나머지는 빈 공간으로 자리만 유지
```

- **ScrollView**: 자식을 전부 즉시 렌더. 항목 수가 적고 고정적일 때(설정 화면, 폼)만. `VStack` in `ScrollView`와 같다.
- **FlatList**: `data` 배열과 `renderItem` 함수를 받아, 보이는 범위만 렌더. `LazyColumn`/`LazyVStack`과 같은 "lazy" 계열. 내부적으로 `VirtualizedList` 기반이며 스크롤에 따라 항목이 마운트/언마운트된다.

기준은 단순하다: **개수가 가변이거나 수십 개를 넘으면 무조건 리스트 컴포넌트.** "일단 ScrollView + map으로 짜고 나중에 바꾸지"는 나중이 안 온다.

### 재활용이 아니라 마운트/언마운트 (vs FlashList)

| | UIKit/RecyclerView | FlatList | FlashList |
|---|---|---|---|
| 화면 밖 항목 | 셀 객체 재활용 풀로 | React 트리에서 **언마운트** (뷰 파괴) | 네이티브 뷰 유지, **재활용** |
| 화면 진입 항목 | dequeue 후 재구성 | 컴포넌트 새로 마운트 (뷰 생성) | 기존 뷰에 새 props 바인딩 |
| 빠른 스크롤 | 안정적 | blank cell 가능 | 상대적으로 안정적 |
| 항목 내부 state | 셀에 두면 안 됨 (재사용 오염) | 언마운트되므로 **소실** | 재활용되므로 **오염 가능** — 항목 밖으로 |

네이티브 개발자에게 중요한 교훈 둘:
1. **FlatList 항목 안의 [[State]]는 스크롤로 벗어나면 사라진다.** 언마운트되기 때문. 체크 상태 같은 것은 항목이 아니라 리스트 데이터(부모 state/스토어)에 둬야 한다 — `prepareForReuse`에서 셀 상태를 리셋해야 했던 것과 같은 규율.
2. **FlashList에서는 반대로 재활용 오염을 조심.** 재활용 셀에 이전 항목의 로컬 state가 남을 수 있으므로 역시 항목 내부 state를 피한다. 결론은 동일: **리스트 항목은 stateless하게, 상태는 데이터에.**

### 핵심 props

```tsx
<FlatList
  data={logs}
  keyExtractor={item => item.id}          // Reconciliation + 가상화 추적용 식별자
  renderItem={({ item, index }) => <LogRow log={item} />}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={EmptyView}
  ListHeaderComponent={Header}
  onEndReached={loadMore}                  // 무한 스크롤 (페이지네이션)
  onEndReachedThreshold={0.5}
  refreshing={refreshing}                  // pull-to-refresh
  onRefresh={reload}
/>
```

- `keyExtractor` — [[Reconciliation]]이 항목 identity를 추적하는 키. `id` 같은 안정적 고유값. 없으면 `item.key` → index 순으로 fallback하는데 index fallback이 함정의 근원.
- `renderItem` — `cellForRowAt`에 해당. `{ item, index }`를 받아 JSX 반환.
- 성능 튜닝 props(존재만 알아두기): `initialNumToRender`(첫 렌더 개수), `windowSize`(뷰포트 대비 유지 범위), `maxToRenderPerBatch`, `removeClippedSubviews`, `getItemLayout`(높이 고정이면 측정 생략으로 점프·성능 개선). 기본값으로 시작하고, 문제가 측정되면 만진다.

### FlashList — 실무 기본값

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={logs}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <LogRow log={item} />}
/>
```

API가 FlatList와 거의 호환이라 이행 비용이 낮다. v1에서 필수였던 `estimatedItemSize`는 v2(New Architecture 전용)에서 불필요해졌다 — 사용 버전의 공식 문서 확인. Expo SDK 57 프로젝트에서는 `npx expo install @shopify/flash-list`로 설치한다. 짧은 정적 리스트가 아닌 한 신규 코드는 FlashList로 시작하는 것이 현재 생태계의 통상 권장이다.

### 리스트 항목에 React.memo를 쓰는 이유

리스트를 가진 부모가 리렌더되면(예: 검색어 state 변경) 기본 규칙대로 **마운트되어 있는 모든 항목 컴포넌트도 리렌더**된다([[Re-render]]). 항목이 무겁고 개수가 많으면 여기서 프레임이 떨어진다. `React.memo`([[Memoization]])로 감싸면 props가 얕은 비교로 같을 때 항목 렌더를 스킵한다.

```tsx
const LogRow = React.memo(function LogRow({ log, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(log.id)}>
      <Text>{log.title}</Text>
    </Pressable>
  );
});
```

단, memo는 props 참조가 안정적일 때만 작동한다. 부모가 매 렌더 새로 만드는 인라인 람다/객체를 넘기면 비교가 항상 실패해 무의미해진다 — 그래서 콜백은 `useCallback`으로 고정해서 내린다. Compose에서 unstable 파라미터가 skip을 깨는 것과 정확히 같은 구조의 문제다.

## 코드 예시

RN 0.76+ / TypeScript. FlatList + memo 항목 + useCallback + 무한 스크롤 뼈대.

```tsx
import React, { useCallback, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';

type Log = { id: string; title: string; done: boolean };

const LogRow = React.memo(function LogRow({
  log, onToggle,
}: { log: Log; onToggle: (id: string) => void }) {
  return (
    <Pressable style={styles.row} onPress={() => onToggle(log.id)}>
      <Text style={log.done && styles.doneText}>{log.title}</Text>
    </Pressable>
  );
});

export default function LogListScreen() {
  const [logs, setLogs] = useState<Log[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`, title: `운동 기록 ${i}`, done: false,
    })),
  );

  // useCallback으로 참조 고정 → LogRow의 memo가 실제로 작동
  const toggle = useCallback((id: string) => {
    setLogs(prev => prev.map(l => (l.id === id ? { ...l, done: !l.done } : l)));
  }, []);

  const loadMore = useCallback(() => {
    setLogs(prev => [
      ...prev,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `log-${prev.length + i}`, title: `운동 기록 ${prev.length + i}`, done: false,
      })),
    ]);
  }, []);

  return (
    <FlatList
      data={logs}
      keyExtractor={item => item.id}                 // index 아님!
      renderItem={({ item }) => <LogRow log={item} onToggle={toggle} />}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      ListEmptyComponent={<Text style={styles.empty}>기록이 없습니다</Text>}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 8 },
  row: { paddingHorizontal: 16, paddingVertical: 14 },
  doneText: { textDecorationLine: 'line-through', color: '#999' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#ddd' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
```

토글 시 흐름: `toggle` → `logs` 배열 교체 → FlatList 리렌더 → 각 항목은 memo 비교 → **`log` 객체 참조가 바뀐 한 행만** 리렌더. 이것이 diffable data source의 "변경된 셀만 reload"에 해당하는 결과를 선언형으로 얻는 방법이다.

## 함정 (Pitfalls)

- **`keyExtractor`에 index 사용**: 삽입/삭제/정렬 시 [[Reconciliation]]이 "0번은 여전히 0번"이라고 믿어, 항목 컴포넌트의 state·애니메이션이 엉뚱한 데이터에 붙는다. 삭제했는데 아랫줄이 체크되어 있는 버그가 전형. 항목 고유 id를 쓸 것 — 서버에 id가 없으면 생성 시점에 만들어 붙인다.
- **항목 내부에 상태 저장**: 스크롤로 언마운트되면 소실(FlatList), 재활용으로 오염(FlashList). 상태는 리스트 데이터로 올린다.
- **인라인 `renderItem` 안에서 익명 컴포넌트 정의**: `renderItem={() => { const Row = () => ...; return <Row/> }}`처럼 렌더마다 컴포넌트 *타입*이 새로 만들어지면 매번 전체 언마운트/마운트된다. 컴포넌트는 파일 최상위에 정의. (인라인 화살표 함수로 기존 컴포넌트를 *호출*하는 것 자체는 흔한 패턴이고, memo 효과만 줄어든다.)
- **memo + 인라인 콜백**: `onToggle={() => toggle(item.id)}`를 memo된 항목에 직접 넘기면 매 렌더 새 함수라 memo 무효. id를 항목이 갖고 콜백은 `useCallback`으로 고정해 내리는 위 예시 패턴을 쓴다.
- **데이터 변이 후 같은 참조로 setState**: `logs[0].done = true; setLogs(logs)`는 FlatList가 변경을 감지 못 한다. 항상 새 배열/새 항목 객체.
- **ScrollView 안에 FlatList(같은 방향) 중첩**: 가상화가 무력화되고 경고가 뜬다. 헤더가 필요하면 `ListHeaderComponent`로 리스트 안에 넣는다. `UITableView`를 `UIScrollView`에 넣지 말라는 것과 같은 이야기.
- **`onEndReached` 중복 호출**: 로딩 중 재진입을 막는 가드(`isLoading` 체크)를 넣지 않으면 같은 페이지를 여러 번 요청한다.
- **성능 튜닝 props를 감으로 조정**: `windowSize`를 늘리면 blank cell은 줄지만 메모리가 는다. 계측(프로파일링) 없이 만지지 말고, 그 전에 항목 컴포넌트 경량화·memo·FlashList 전환부터.

## 관련 노트

[[FlatList]] · [[Re-render]] · [[Reconciliation]] · [[Memoization]] · [[Yoga]] · [[Fabric]] · 이전: [[03-스타일링과-Flexbox]] · 다음: [[05-내비게이션]]

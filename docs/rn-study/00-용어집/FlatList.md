# FlatList

> [!abstract] 한 줄 정의
> RN 코어의 가상화(virtualized) 리스트 컴포넌트. 화면 근처의 항목만 렌더하고 멀리 벗어난 항목은 렌더 트리에서 내려서, 항목 수천 개짜리 리스트도 메모리·성능을 유지한다.

> [!info] iOS/AOS로 치면
> `UICollectionView`/`UITableView`, `RecyclerView`. Compose로는 `LazyColumn`, SwiftUI로는 `List`/`LazyVStack`. "보이는 것만 만든다"는 목표가 같다.

## 📖 설명

`ScrollView`는 자식 전체를 한 번에 렌더한다 — `UIScrollView`에 서브뷰 1000개를 다 addSubview하는 것과 같아서 데이터가 많으면 못 쓴다. FlatList는 데이터 배열과 항목 렌더 함수를 받아, 뷰포트 주변 윈도우 안의 항목만 실제로 렌더한다:

```jsx
<FlatList
  data={logs}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <LogRow log={item} />}
/>
```

`keyExtractor`는 [[Reconciliation]]의 key를 공급하는 것으로, 셀 신원 식별에 필수다. 그 외 `ListHeaderComponent`, `ItemSeparatorComponent`, `onEndReached`(무한 스크롤), `refreshControl`(pull-to-refresh), `numColumns` 등 UITableView delegate/dataSource로 하던 일들이 [[Props]]로 제공된다. 섹션 리스트는 별도 컴포넌트 `SectionList`가 담당한다.

**RecyclerView와의 결정적 차이 — 재활용(recycle)이 아니라 가상화(virtualize)다.** RecyclerView/UICollectionView는 화면 밖으로 나간 **네이티브 셀 뷰 객체를 풀에 보관했다가 재사용**한다. FlatList는 윈도우를 벗어난 항목을 React 트리에서 **언마운트(파괴)**하고, 다시 보이면 **새로 렌더(생성)**한다. 재활용 풀이 없다. 이 때문에:

- 빠르게 스크롤하면 아직 렌더 안 된 영역이 빈 화면(blank cell)으로 보일 수 있다 — 항목 생성이 JS 스레드 렌더를 거치기 때문.
- 항목 컴포넌트 렌더 비용이 스크롤 성능에 직결된다. 항목을 `React.memo`로 감싸고([[Memoization]]), `renderItem`에 넘기는 함수 참조를 안정화하는 것이 기본 최적화다.
- `getItemLayout`으로 항목 높이를 미리 알려주면 측정 비용을 건너뛴다 (고정 높이일 때).
- 항목이 언마운트되므로 항목 내부 [[State]]는 스크롤 아웃 시 사라진다. 유지가 필요하면 상위로 올린다.

**FlashList (Shopify)** — 이 구조적 한계를 셀 재활용 방식으로 해결한 대안 라이브러리다. RecyclerView처럼 화면 밖 컴포넌트를 파괴하지 않고 다른 데이터로 재활용해서, 같은 코드 모양으로 훨씬 나은 스크롤 성능을 낸다. API가 FlatList와 거의 호환되어 교체 비용이 낮고, 성능이 중요한 긴 리스트에서는 사실상 기본 선택지로 자리잡았다. 네이티브 출신에게는 오히려 FlashList의 동작(재활용 시 항목 컴포넌트가 다른 데이터로 재사용됨 — `prepareForReuse`에서 상태 초기화하던 그 문제)이 더 익숙할 것이다. 최신 버전·API는 공식 문서 확인.

내부적으로 FlatList는 `VirtualizedList` 위의 편의 래퍼이며, [[New Architecture]]/[[Fabric]] 환경에서도 그대로 동작한다.

## 🔗 관련
[[Reconciliation]] · [[Memoization]] · [[Re-render]] · [[Props]] · [[Fabric]]

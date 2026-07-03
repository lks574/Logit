# React Navigation

**한 줄 정의**: React Native의 사실상 표준 내비게이션 라이브러리. 화면 스택, 탭, 드로어, 모달 등 앱 내비게이션 구조 전반을 담당한다.

**iOS/AOS로 치면**: `UINavigationController` + `UITabBarController` + present/dismiss를 라이브러리 하나로 묶은 것. Android로는 Jetpack Navigation(NavHost + NavController) + BottomNavigationView에 해당한다.

## 설명

RN 코어에는 내비게이션이 **포함되어 있지 않다.** 화면 전환은 전적으로 라이브러리 영역이고, 그 표준이 React Navigation이다. 커뮤니티 주도로 개발되며 Expo·RN 공식 문서 모두 이걸 기본으로 안내한다.

기본 구조는 "네비게이터(컨테이너)를 선언하고 그 안에 화면(Screen)을 등록"하는 것이다:

```jsx
const Stack = createNativeStackNavigator();

<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Detail" component={DetailScreen} />
  </Stack.Navigator>
</NavigationContainer>
```

화면 안에서는 `navigation.navigate('Detail', { id: 42 })`로 이동하고, 받는 쪽은 `route.params`로 파라미터를 읽는다. push/pop/goBack, 헤더 옵션, 전환 애니메이션 등 네이티브 개발자가 기대하는 개념이 거의 1:1로 있다.

네비게이터 종류와 네이티브 대응:

- **Native Stack** (`createNativeStackNavigator`) — 실제 `UINavigationController`/`Fragment` 트랜잭션을 사용. 네이티브와 동일한 전환 애니메이션·제스처·헤더를 얻는다. 기본 선택지.
- **Stack** (JS 구현) — 전환을 JS/[[Reanimated]]로 그리는 스택. 커스터마이즈 자유도가 높은 대신 네이티브 느낌 재현은 직접 책임.
- **Bottom Tabs** — `UITabBarController`/BottomNavigation 대응.
- **Drawer** — 햄버거 사이드 메뉴. Android DrawerLayout 대응.
- **Modal** — 별도 네비게이터가 아니라 스택 화면의 `presentation: 'modal'` 옵션. iOS의 sheet/fullScreenCover 스타일 대응.

이들을 **중첩**해서 앱 구조를 만든다. 전형적으로 "루트 Stack 안에 Tab 네비게이터, 각 탭 안에 다시 Stack" 구조다. 네이티브에서 탭 컨트롤러의 각 탭에 내비게이션 컨트롤러를 넣는 것과 같은 그림이다.

내비게이션 상태는 네이티브처럼 뷰 컨트롤러 스택이 아니라 **직렬화 가능한 JS 상태 객체**로 관리된다. 이 덕에 상태 복원, 딥링크 → 상태 매핑, 디버깅이 쉽다. 딥링크는 URL ↔ 화면 매핑(linking 설정)을 직접 선언해야 하는데, 이 수동 설정을 파일 컨벤션으로 자동화한 것이 [[Expo Router]]다. Expo Router를 쓰더라도 내부는 React Navigation이므로 화면 옵션·동작 개념은 그대로 통용된다.

주의점: 화면 컴포넌트는 기본적으로 스택에 있는 동안 언마운트되지 않는다(뒤로 가기 시 파괴). `useEffect`는 화면 이탈/복귀가 아니라 마운트/언마운트에 묶이므로, 화면 포커스 기준 로직에는 `useFocusEffect` 같은 전용 [[Hook]]을 쓴다 — `viewWillAppear` 대응물이 필요할 때 찾게 되는 API다.

## 관련
[[Expo Router]] · [[Reanimated]] · [[Hook]] · [[State]] · [[Re-render]]

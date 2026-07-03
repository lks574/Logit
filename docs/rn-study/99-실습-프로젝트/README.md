# 실습 프로젝트 — Logit 기반

> 이 레포(Logit) 자체가 실습 코드베이스다. 커리큘럼 Phase 진도에 맞춰 아래 과제를 순서대로 수행한다.
> 각 과제의 **확인 포인트**를 스스로 설명할 수 있으면 통과.

## 실행 환경 먼저

- 이 프로젝트는 Expo SDK 57이라 **스토어 [[Expo Go]]로는 실기기 실행 불가**. 실기기는 [[Dev Client]] 빌드(dev 빌드)로만 가능.
- 실행 방법·빌드·터널·Release는 **[docs/DEVICE_TESTING.md](../../DEVICE_TESTING.md)** 를 따를 것.
- 가장 빠른 확인 루프는 웹 프리뷰: `npm run web`. 단 `Alert` 같은 네이티브 UI는 웹에서 안 보인다.
- 읽기 과제는 빌드 없이 에디터만으로 가능하다.

## 주의: 이 레포와 커리큘럼 용어의 차이

- 네비게이션: 이 레포는 **[[React Navigation]] 코드 기반**이다(`src/navigation/`). [[Expo Router]]의 파일 기반 라우팅(`app/` 디렉토리)은 **쓰지 않는다** — `app/` 폴더 자체가 없다. 두 방식을 비교하는 것도 학습 포인트.
- 상태 관리: Zustand/Redux 같은 라이브러리 대신 **React Context + AsyncStorage** 조합이다(`src/store/`). 계약은 [docs/STORE.md](../../STORE.md).
- 리스트: 데이터가 수십 건 규모라 [[FlatList]] 없이 `ScrollView` + `map`으로 렌더한다. 언제 [[FlatList]]로 승격해야 하는지 생각해 볼 것.
- [[Reanimated]]는 설치되어 있지 않다 — 애니메이션 과제는 이 레포 밖에서.

---

## A. 읽기 과제 (Phase 1~2 병행) — 빌드 불필요

### A-1. 앱 엔트리 포인트부터 첫 화면까지 코드로 추적하기

iOS의 `@main`/`AppDelegate`, Android의 `Application`/`MainActivity`에 해당하는 것이 JS 쪽 어디인지 찾는다.

1. `package.json`의 `"main": "index.ts"` 확인.
2. `index.ts` — `registerRootComponent(App)`. 주석에 있듯 내부적으로 `AppRegistry.registerComponent('main', () => App)`을 호출한다.
3. `App.tsx` — Provider 트리를 읽는다: `SafeAreaProvider > ThemeProvider > StoreProvider > Root`. 네이티브의 DI 컨테이너/전역 싱글턴 초기화에 해당하는 층이 어디인지 생각해 본다.
4. `src/navigation/RootNavigator.tsx` — `NavigationContainer > Stack.Navigator`의 첫 스크린 `MainTabs` → 첫 탭 `HomeScreen`.
5. `src/screens/home/HomeScreen.tsx` 도달.

- **확인 포인트**:
  - "네이티브 앱 시작 → JS [[Bundle]] 로드([[Metro]] 또는 임베드) → [[Hermes]]가 실행 → `registerRootComponent` → React 트리 마운트" 순서를 말로 설명할 수 있다.
  - Provider가 왜 이 순서로 중첩되는지(안쪽이 바깥쪽 Context를 쓸 수 있음 — 예: `PersistErrorBanner`가 theme·store·safe-area 셋 다 소비) 설명할 수 있다.
  - [[JSX]]로 쓰인 `<App />`이 함수 호출로 변환된다는 것을 안다.

### A-2. package.json 의존성을 JS-only / 네이티브 포함으로 분류하기

`package.json`의 `dependencies` 17개를 두 그룹으로 나눈다. 기준: **네이티브 코드(iOS/Android)가 들어 있어 [[Autolinking]]·[[Prebuild]] 대상이 되는가?**

- 판별법: `node_modules/<패키지>/` 아래에 `ios/`·`android/` 폴더 또는 `*.podspec` 파일이 있으면 네이티브 포함. 예:
  ```bash
  ls node_modules/react-native-screens/ios          # 있음 → 네이티브 포함
  ls node_modules/@react-navigation/native/ios      # 없음 → JS-only
  ```
- 분류해 볼 목록(정답을 먼저 보지 말 것): `@expo/metro-runtime`, `@react-native-async-storage/async-storage`, `@react-navigation/*` 3종, `expo`, `expo-dev-client`, `expo-document-picker`, `expo-file-system`, `expo-image-picker`, `expo-sharing`, `expo-status-bar`, `expo-system-ui`, `react`, `react-dom`, `react-native`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-web`.

- **확인 포인트**:
  - "JS-only 라이브러리는 [[OTA Update]]로 갱신 가능하지만, 네이티브 포함 라이브러리를 추가/변경하면 **재빌드가 필요하다**"를 이 목록 기준으로 설명할 수 있다.
  - `@react-navigation/*`이 JS-only인데도 `react-native-screens`(네이티브)에 의존하는 구조 — "JS 라이브러리가 네이티브 구현을 별도 peer 패키지로 위임"하는 패턴을 이해한다.
  - [[Turbo Module]]/[[Expo Modules API]]가 이 "네이티브 포함" 라이브러리들이 JS와 만나는 방식([[JSI]] 기반, [[New Architecture]])임을 안다.

### A-3. 네비게이션 라우트 구조 그려보기

`src/navigation/RootNavigator.tsx`와 `src/navigation/types.ts`(`RootStackParamList`, `TabParamList`)를 읽고 라우트 트리를 종이에 그린다.

```
NavigationContainer
└─ Stack (native-stack)
   ├─ MainTabs ── Tab: Home / Calendar / Stats / Settings   ← 커스텀 BottomTabBar.tsx
   ├─ (modal group) AddChooser / ActivitySelect / RecordForm / AddPlan / AddActivity / ProfileEdit
   ├─ Detail { activity, recordId? }
   └─ Plans
```

- 각 라우트가 받는 파라미터(`RecordForm{activity,template}` 등)를 `types.ts`에서 확인한다. UIKit의 세그웨이 + sender, 혹은 Compose Navigation의 route arguments에 대응.
- **비교 학습**: 같은 구조를 [[Expo Router]]로 만들었다면 `app/(tabs)/index.tsx`, `app/record-form.tsx` 같은 **파일 경로가 곧 라우트**가 됐을 것이다. 코드 기반([[React Navigation]]) vs 파일 기반([[Expo Router]])의 차이를 정리한다.

- **확인 포인트**:
  - `presentation: 'modal'` 그룹이 iOS의 modal presentation / Android의 별도 액티비티 스타일에 어떻게 대응하는지 설명할 수 있다.
  - "탭 안의 화면(Home 등)은 탭바가 있고, Stack에 직접 걸린 화면(Detail 등)은 없다"를 네비게이터 중첩 구조로 설명할 수 있다.
  - 화면 이동이 `nav.navigate('Detail', { activity: '런닝' })`처럼 **문자열 라우트 + params**이고, 타입 안전은 `RootStackParamList`가 담당함을 안다.

### A-4. 레이아웃을 Flexbox([[Yoga]])로 읽기

`src/components/cards.tsx`의 `ActivityCard`(왼쪽 4px 컬러 바 + 본문 + 오른쪽 메타)를 읽고, Auto Layout/ConstraintLayout이라면 어떻게 짰을지와 비교한다. `src/components/primitives.tsx`의 `<Row gap between center>`가 flexbox 속성의 얇은 래퍼임을 확인한다.

- **확인 포인트**: `flexDirection`·`flex: 1`·`gap`·`flexShrink: 0`(아이콘 찌그러짐 방지)이 각각 무슨 제약(constraint)에 해당하는지 말할 수 있다. 레이아웃 계산을 [[Yoga]]가 [[Fabric]]의 Shadow Tree에서 수행함을 안다.

---

## B. 관찰 과제 (Phase 2~3 병행) — 앱 실행 필요

실행: `npm run web`(가장 빠름) 또는 dev 빌드([docs/DEVICE_TESTING.md](../../DEVICE_TESTING.md)).

### B-1. [[Fast Refresh]] 체험 — 상태가 살아남는 것을 본다

1. 앱 실행 → 설정 탭에서 테마를 dark로 토글해 둔다(= 앱에 런타임 [[State]]가 생김).
2. `src/screens/home/HomeScreen.tsx`에서 아무 텍스트 리터럴(예: 인사말)을 수정하고 저장.
3. 화면이 **재시작 없이** 바뀌고, dark 테마 상태가 **유지**되는 것을 확인한다.
4. 이번엔 컴포넌트 파일이 아닌 `src/store/selectors.ts`의 함수를 수정해 본다 — 전체 리로드(full reload)가 일어나 상태가 초기화되는 차이를 관찰한다.

- **확인 포인트**: "네이티브의 수정→재컴파일→재실행→상태 재현" 루프와 무엇이 다른지, [[Fast Refresh]]가 왜 컴포넌트만 export하는 파일에서 상태를 보존할 수 있는지 설명할 수 있다. [[Metro]]가 변경 모듈만 다시 보내는 구조임을 안다.

### B-2. [[State]] 변경 → [[Re-render]] 추적 (console.log 심기)

1. `src/screens/home/HomeScreen.tsx` 컴포넌트 함수 본문 **맨 위**에 `console.log('HomeScreen render')`를 심는다.
2. `src/screens/settings/SettingsScreen.tsx`에도 같은 로그를 심는다.
3. 앱에서 기록을 하나 추가(FAB → 기록 → 런닝 → 저장)하고 로그를 본다.
4. 어떤 컴포넌트가 몇 번 다시 실행됐는지 센다. 특히 저장 ~1.5초 후 sync 배지가 `pending → synced`로 바뀔 때 **한 번 더** 렌더가 도는 것을 확인한다.

- **확인 포인트**:
  - [[Re-render]] = "컴포넌트 **함수가 다시 실행**되어 새 JSX를 반환"이지, 화면 픽셀을 전부 다시 그리는 draw 호출이 아님을 설명할 수 있다(실제 네이티브 뷰 변경은 diff된 부분만).
  - 로그가 예상보다 많이 찍힌다면 왜인지(부모 렌더 전파, Context 값 변경) 추적할 수 있다.

### B-3. 스토어 구독 흐름 추적 — Context + AsyncStorage

[docs/STORE.md](../../STORE.md)를 먼저 읽는다. 이 레포는 Zustand 대신 React Context를 쓴다 — 구독 메커니즘 관찰엔 오히려 더 투명하다.

1. `src/store/StoreContext.tsx`에서 `addRecord` 액션 내부와 AsyncStorage `setItem` 지점에 로그를 심는다.
2. 기록 저장 플로우를 실행하고 순서를 관찰한다: **폼의 `handleSave` → `addRecord` → `setState` → Context value 변경 → `useStore()` 소비자 전원 리렌더 → (ready 가드 통과 후) AsyncStorage 직렬화 저장 → ~1.5초 뒤 `sync:'synced'` 전환 → 또 리렌더**.
3. 앱을 완전히 종료 후 재실행 — `logit.store.v1` 키에서 rehydrate되어 기록이 살아있는 것을 확인한다(오프라인 우선).

- **확인 포인트**:
  - "쓰기는 메모리 [[State]]에 먼저, 영속화는 부수효과로"라는 offline-first 흐름을 그릴 수 있다.
  - Context 방식의 비용 — value가 바뀌면 **모든 소비자가 리렌더**됨 — 을 로그로 확인했고, Zustand 같은 라이브러리가 selector 단위 구독으로 이를 어떻게 줄이는지([[Memoization]]과 함께) 개념으로 설명할 수 있다.
  - `useEffect`의 의존성 배열과 `ready` 가드가 "복원 전 seed가 저장소를 덮어쓰는" 레이스를 어떻게 막는지 설명할 수 있다.

### B-4. [[Metro]]와 [[Bundle]] 관찰

1. `npm start`로 [[Metro]]를 띄우고 터미널 출력을 본다: 번들링 진행률, 모듈 수.
2. 브라우저에서 `http://localhost:8081/index.bundle?platform=ios&dev=true`를 열어 번들의 실체(거대한 JS 파일 하나)를 눈으로 확인한다.
3. 파일 하나를 수정하고 [[Fast Refresh]] 시 Metro가 무엇을 다시 보내는지 로그로 관찰한다.

- **확인 포인트**: "Xcode/Gradle의 컴파일·링크에 해당하는 것이 Metro의 transform+bundle"이라고 대응시킬 수 있다. dev 모드(Metro 서버에서 로드)와 release 모드(번들 임베드, [[Hermes]] 바이트코드)의 차이를 안다.

---

## C. 수정 과제 (Phase 3 이후) — 코드 변경

> 레포 규칙([docs/FOUNDATION.md](../../FOUNDATION.md)): 공용 컴포넌트/테마 파일은 수정하지 않는다. 화면 파일 안에서 지역적으로 작업. 색은 `c.*` 토큰만. 완료 후 `npx tsc --noEmit` 클린 확인.

### C-1. 기존 화면에 작은 UI 요소 추가

`src/screens/home/HomeScreen.tsx`의 "이번 주" 카드(기록 수 · 종목 수 / 🔥연속이 표시되는 인라인 카드, 105행 부근)에 지표를 하나 더 추가한다. 예: 평점을 남긴 기록 수. 데이터는 이미 받고 있는 `records`에서 계산(`records.filter(r => r.rating != null)` 등), 표시는 카드 안에 `<Text>` 한 줄 추가. 색은 `c.*` 토큰만.

- **확인 포인트**: [[Props]]로 데이터가 내려가는 흐름(계산은 화면에서, 표시는 컴포넌트에서)을 지켰다. 데이터가 바뀌면 UI가 **선언적으로** 따라 바뀐다 — 네이티브처럼 `label.text = ...` 갱신 코드를 쓰지 않았다.

### C-2. 스타일 변경 — 테마 토큰 체계 안에서

`src/screens/settings/SettingsScreen.tsx`에서 섹션 간 간격이나 카드 radius를 바꿔 본다. 반드시 `useTheme()`의 `c.*`와 `radius`(`src/theme/tokens.ts`) 토큰을 사용. 바꾼 뒤 설정에서 light/dark를 토글해 **양쪽 테마에서 모두** 자연스러운지 확인한다.

- **확인 포인트**: `StyleSheet`/인라인 스타일이 [[Yoga]] 레이아웃 속성 + 페인트 속성의 조합임을 안다. 하드코딩 hex 대신 토큰을 쓰면 테마 전환이 공짜로 따라오는 이유(Context 값 교체 → [[Re-render]])를 설명할 수 있다.

### C-3. 새 화면 추가 — [[React Navigation]] 라우트 등록 전 과정

설정 탭에 "앱 정보" 화면을 추가한다.

1. `src/screens/settings/AboutScreen.tsx` 생성 — `<Screen>` + `<T>` 프리미티브 사용, `export default function AboutScreen()`.
2. `src/navigation/types.ts`의 `RootStackParamList`에 `About: undefined` 추가.
3. `src/navigation/RootNavigator.tsx`에 `<Stack.Screen name="About" component={AboutScreen} />` 등록(모달 그룹에 넣을지 판단).
4. `SettingsScreen.tsx`에 `SettingsRow` 하나 추가 → `nav.navigate('About')`.
5. `npx tsc --noEmit` 클린 + 실기기/웹에서 진입·뒤로가기 확인.

- **확인 포인트**:
  - 화면 추가에 필요한 3접점(화면 파일 / 파라미터 타입 / 네비게이터 등록)을 안다. [[Expo Router]]였다면 `app/about.tsx` 파일 생성 **하나로** 끝났을 것 — 트레이드오프(명시성 vs 관례)를 설명할 수 있다.
  - 이 변경은 JS만 건드리므로 재빌드 없이 [[Fast Refresh]]로 즉시 반영된다 — A-2에서 배운 JS-only/네이티브 경계를 몸으로 확인.

### C-4. (심화) 셀렉터 추가 — 파생 데이터 패턴

`src/store/selectors.ts`에 순수 함수 셀렉터를 하나 추가한다. 예: `ratedCount(records)` 또는 "이번 달 기록 수". 저장된 값을 바꾸지 말고 **계산으로만** 만들고, C-1에서 추가한 지표를 이 셀렉터 호출로 교체한다. 기존 `weekStats`가 `{count, km, streak, composition}`을 계산하는 방식을 참고. [docs/DATA_MODEL.md](../../DATA_MODEL.md) §6 참고.

- **확인 포인트**: "저장은 정규 데이터(`fields`), 표시는 파생 계산"이라는 분리를 지켰다. 셀렉터가 순수 함수라 테스트/재사용이 쉬운 이유를 설명할 수 있다.

### C-5. (심화) 네이티브 의존성 추가를 시뮬레이션 없이 이해하기

실제로 추가하진 말고, 만약 `expo-haptics`(네이티브 포함)를 추가한다면 무슨 일이 필요한지 순서를 적어 본다: `npx expo install` → [[Autolinking]] → [[Prebuild]]/`pod install` → **재빌드**([[Dev Client]] 다시 설치). `app.json`의 [[Config Plugin]] 배열(이 레포엔 `expo-image-picker` 권한 문구가 이미 있다)이 [[Prebuild]] 때 네이티브 프로젝트에 무엇을 주입하는지 확인한다.

- **확인 포인트**: "JS 의존성은 `npm install`로 끝, 네이티브 의존성은 재빌드까지"를 자기 말로 설명할 수 있다. [[EAS]] 빌드가 이 과정을 클라우드에서 대신하는 것임을 안다.

---

## 다음

과제 중 걸려 넘어진 지점은 [[네이티브-개발자의-함정]]에 즉시 기록할 것. 그 노트가 이 실습의 진짜 산출물이다.

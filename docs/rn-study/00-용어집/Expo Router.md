# Expo Router

**한 줄 정의**: `app/` 디렉토리의 **파일 구조가 곧 앱의 라우트**가 되는 파일 기반(file-based) 라우팅 라이브러리. [[React Navigation]] 위에 구축되어 있으며, 모든 화면이 자동으로 딥링크 가능해진다.

**iOS/AOS로 치면**: 네이티브에 직접적인 대응물이 없는 웹(Next.js) 유래 개념이다. 굳이 비유하면 "스토리보드의 세그 정의 + Universal Link 라우팅 테이블을 파일 시스템이 자동 생성해주는 것". 내부 동작은 결국 [[React Navigation]]의 stack/tab이므로 UINavigationController/Jetpack Navigation 위의 편의 계층이라 보면 된다.

## 설명

전통적인 방식([[React Navigation]] 직접 사용)에서는 화면 목록과 네비게이터 구조를 코드로 등록한다. Expo Router는 이 등록을 없애고 **파일 시스템을 라우팅 설정으로 사용**한다:

```
app/
  _layout.tsx        → 루트 레이아웃 (네비게이터 선언: Stack/Tabs)
  index.tsx          → "/" (홈)
  settings.tsx       → "/settings"
  log/
    [id].tsx         → "/log/123" (동적 세그먼트, useLocalSearchParams로 접근)
  (tabs)/            → URL에 안 드러나는 그룹 (탭 묶음 등)
  +not-found.tsx     → 매칭 실패 시
```

파일을 만들면 화면이 생기고, `router.push('/log/123')` 또는 `<Link href="/log/123">`으로 이동한다. `_layout.tsx`가 그 디렉토리의 화면들을 감싸는 네비게이터([[React Navigation]]의 Stack, Tabs 등)를 정의하므로, 중첩 디렉토리 = 중첩 네비게이터가 된다.

**왜 존재하는가 / 무엇을 해결하는가**:

1. **딥링크 자동화** — 모든 화면이 파일 경로 = URL을 가지므로, 별도 링킹 설정 없이 딥링크·Universal Links가 기본으로 동작한다. 네이티브에서 딥링크 라우팅 테이블을 수동 관리해본 사람에게는 큰 차이점이다.
2. **타입 안전 라우트** — 파일 구조에서 라우트 타입을 생성해 `push('/settngs')` 같은 오타를 컴파일 타임에 잡을 수 있다 (typed routes 설정, 상세는 공식 문서 확인).
3. **웹 동시 타겟** — 같은 코드가 웹에서는 실제 URL 라우팅으로 동작한다. RN의 "한 코드베이스, iOS/Android/Web" 전략과 맞물린다.
4. **구조 강제** — 화면 배치가 컨벤션으로 통일되어 프로젝트 간 이동이 쉽다.

[[React Navigation]]과의 관계는 "대체"가 아니라 "래핑"이다. 화면 옵션, 네이티브 스택 전환 애니메이션, 탭 바 커스터마이즈 등은 결국 React Navigation의 개념·옵션을 그대로 쓴다. 문제 해결 시 React Navigation 문서를 함께 봐야 하는 이유다. Expo가 새 프로젝트의 기본 내비게이션으로 미는 방식이며, Expo SDK 57 기준 신규 템플릿의 기본값이다.

단점/주의: 파일 이름 컨벤션(`(그룹)`, `[param]`, `_layout`, `+`)을 외워야 하고, 라우팅이 파일 시스템에 묶이므로 완전히 동적인 네비게이터 구성에는 React Navigation 직접 사용보다 유연성이 떨어질 수 있다.

## 관련
[[React Navigation]] · [[Expo Go]] · [[Dev Client]] · [[Metro]] · [[Managed Workflow]]

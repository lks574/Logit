# Greenfield

> [!abstract] 한 줄 정의
> 기존 코드 없이 **처음부터 React Native로 시작하는** 앱. RN이 앱의 엔트리 포인트와 전체 UI를 소유한다. 기존 네이티브 앱에 RN을 심는 [[Brownfield]]의 반대말.

> [!info] iOS/AOS로 치면
> 새 프로젝트를 SwiftUI 100% / Compose 100%로 시작하는 것과 같은 결정. "앱의 루트가 어느 프레임워크 것인가"라는 소유권 질문에서, greenfield는 루트가 RN이다.

## 📖 설명

greenfield(미개발 부지)/brownfield(재개발 부지)는 건설 용어에서 온 일반 소프트웨어 용어지만, RN 커뮤니티에서는 특히 **RN 통합 방식의 양대 분류**로 굳어졌다. 아키텍처 논의, 라이브러리 README("brownfield 지원 여부"), 채용 공고에까지 흔히 등장하므로 대화에 끼려면 필수 어휘다.

Greenfield RN 앱의 구조:

- 프로젝트 생성 시점부터 RN 템플릿(현재 권장: `npx create-expo-app`)으로 시작한다.
- 앱 시작 → 네이티브 셸이 RN 런타임([[Hermes]])을 띄우고 JS [[Bundle]]을 로드 → 루트 React 컴포넌트가 화면 전체를 차지. 이후 모든 화면·내비게이션([[Expo Router]]/[[React Navigation]])이 React 세계 안에서 일어난다.
- `ios/`·`android/` 네이티브 프로젝트는 존재하지만 사실상 RN을 부팅하는 얇은 껍데기이며, [[Managed Workflow]]([[CNG]])라면 그 껍데기조차 생성기가 관리한다.
- 네이티브 코드는 "앱의 뼈대"가 아니라 "RN에서 호출하는 모듈"([[Turbo Module]]/[[Expo Modules API]])로 존재한다.

**왜 greenfield가 기본 경로인가** — RN의 장점이 온전히 발휘되는 구성이기 때문이다:

- 하나의 코드베이스·하나의 팀으로 iOS/Android(때로 웹까지) 동시 개발.
- [[Fast Refresh]] 중심의 빠른 개발 루프, [[OTA Update]]로 스토어 심사 없이 JS 수정 배포.
- 도구 체인([[Expo Go]]/[[Dev Client]], [[EAS]], [[Autolinking]])이 전부 "RN이 주인"이라는 가정으로 설계되어 있어 마찰이 없다.

반면 [[Brownfield]]는 기존 네이티브 앱이라는 제약 조건 아래에서 RN을 라이브러리로 끼워 넣는 것이라, 런타임 부팅·내비게이션 경계·빌드 통합을 전부 수동으로 조율해야 한다. 즉 "greenfield vs brownfield"는 기술 선택이라기보다 **출발 조건의 문제**다: 새 앱이면 greenfield가 자연스럽고, 이미 큰 네이티브 앱이 있으면 brownfield 외에 선택지가 없다 (전면 재작성을 하지 않는 한).

네이티브 시니어가 주의할 뉘앙스: greenfield RN 앱에서도 네이티브 지식은 여전히 가치가 있다 — 다만 역할이 "화면을 만드는 사람"에서 "플랫폼 능력을 모듈로 노출하고, 빌드·배포·성능의 네이티브 계층을 책임지는 사람"으로 이동한다. 이 레포(Logit)도 greenfield Expo 앱이다.

한 가지 더: greenfield로 시작했더라도 나중에 특정 화면을 네이티브로 구현해 섞는 것은 가능하다 (RN 화면에서 네이티브 뷰 컴포넌트를 쓰거나, 네이티브 화면을 모듈로 띄우거나). greenfield/brownfield는 앱의 "루트 소유권"에 대한 분류이지, 화면 단위 기술 선택을 영구히 고정하는 것은 아니다.

## 🔗 관련
[[Brownfield]] · [[Managed Workflow]] · [[Bare Workflow]] · [[CNG]] · [[Expo Router]] · [[OTA Update]]

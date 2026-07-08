# Bridgeless

> [!abstract] 한 줄 정의
> 구 아키텍처의 [[Bridge]]를 코드 경로에서 완전히 제거하고, 앱 초기화부터 통신까지 전부 [[JSI]] 기반으로 동작하는 [[New Architecture]]의 실행 모드.

> [!info] iOS/AOS로 치면
> 하위 호환용 레거시 런타임을 함께 싣고 다니다가 어느 시점에 완전히 걷어낸 상황. Swift 앱에서 Objective-C 런타임 브리징 없이 순수 Swift 경로만 타게 만든 것, 혹은 Android에서 Support Library를 완전히 버리고 AndroidX만 남긴 마이그레이션에 비유할 수 있다.

## 📖 설명

[[New Architecture]] 전환은 한 번에 이뤄지지 않았다. [[Fabric]]과 [[Turbo Module]]이 먼저 도입된 시기에도, 앱 초기화나 일부 통신은 여전히 구 Bridge 인프라 위에서 돌아갔다. 신구 아키텍처가 공존하는 과도기였던 셈이다.

Bridgeless 모드는 이 과도기를 끝내는 단계다. 앱이 시작될 때 Bridge 객체를 아예 생성하지 않고, JS 런타임 초기화·모듈 등록·이벤트 전달까지 전부 새 인프라([[JSI]], ReactHost 등)가 담당한다.

RN 0.76에서 New Architecture가 기본값이 되면서 Bridgeless도 그 기본 구성에 포함되었다.

개발자 입장에서 실질적 의미는 두 가지다.

- **성능과 단순성.** 레거시 계층이 로드되지 않으므로 초기화가 가벼워지고 코드 경로가 하나로 정리된다.
- **호환성 체크포인트.** 오래된 라이브러리 중에는 Bridge API(`RCTBridge` 등)에 직접 의존하는 것들이 있는데, 이런 라이브러리는 Bridgeless 모드에서 깨질 수 있다.

RN 팀은 구식 모듈이 신 아키텍처에서 돌아가도록 interop layer를 제공하지만, 완전하지는 않다. 라이브러리를 고를 때 "New Architecture / Bridgeless 지원 여부"를 확인하는 이유가 이것이다.

용어 정리를 해두자면 — [[New Architecture]]는 [[JSI]]+[[Fabric]]+[[Turbo Module]]+[[Codegen]]을 묶는 총칭이고, Bridgeless는 그중 "Bridge가 완전히 사라진 실행 모드"를 가리키는 좁은 용어다.

커뮤니티에서 "New Arch 켰다"와 "Bridgeless로 돌린다"가 섞여 쓰이지만, 엄밀히는 층위가 다르다.

Expo SDK 57 / RN 0.76+ 기준 새 프로젝트는 별도 설정 없이 이 모드로 시작한다.

트러블슈팅 중 "bridgeless mode에서 X가 안 된다"는 이슈를 만나면, 해당 라이브러리가 레거시 Bridge API에 의존하고 있을 가능성부터 의심하면 된다.

## 🔗 관련
[[Bridge]] · [[New Architecture]] · [[JSI]] · [[Fabric]] · [[Turbo Module]]

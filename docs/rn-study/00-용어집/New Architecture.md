# New Architecture

> [!abstract] 한 줄 정의
> [[JSI]] + [[Fabric]] + [[Turbo Module]] + [[Codegen]]으로 구성된 RN의 새 내부 구조 총칭. 구 아키텍처의 [[Bridge]]를 제거하고 JS↔네이티브를 직접 연결한다. RN 0.76부터 신규 프로젝트의 기본값.

> [!info] iOS/AOS로 치면
> 앱을 유지한 채 런타임 기반을 통째로 교체한 대규모 플랫폼 마이그레이션. Objective-C 런타임 의존을 걷어내는 Swift 전환, 혹은 Dalvik→ART 교체 같은 "겉은 같지만 속이 다른" 세대 교체.

## 📖 설명

2015년 첫 공개된 RN의 원래 구조는 JS와 네이티브가 [[Bridge]]로 JSON 메시지를 주고받는 비동기 구조였다. 단순하고 견고했지만, 직렬화 비용·비동기 강제·단일 큐 혼잡이라는 구조적 한계가 있었다.

Meta는 2018년경부터 내부 재설계를 시작했고, 수년의 점진적 롤아웃 끝에 **RN 0.76(2024년)에서 New Architecture가 기본값**이 되었다. Expo SDK 57 기준 신규 프로젝트는 전부 이 구조 위에서 시작한다.

네 개의 기둥과 각자의 역할:

- **[[JSI]]** — 기반 계층. JS 엔진과 C++를 직렬화 없이 직접 연결. 동기 호출 가능. 나머지 모든 것이 이 위에 선다.
- **[[Fabric]]** — 렌더러. C++ 코어, [[Shadow Tree]] 불변화, 동기 레이아웃 측정, React 18 concurrent rendering 지원.
- **[[Turbo Module]]** — 네이티브 모듈 시스템. lazy 로딩, JSI 직접 호출, 타입 안전.
- **[[Codegen]]** — TS 스펙에서 네이티브 인터페이스를 빌드 타임 생성. JS↔네이티브 계약을 컴파일 타임에 검증.

여기에 Bridge 코드를 완전히 로드하지 않는 실행 모드인 [[Bridgeless]]가 더해져 전환이 완성된다.

사용자가 체감하는 이득을 한 문장으로 요약하면: **"JS와 네이티브가 서로를 직접 부를 수 있게 되어, 비동기 강제 때문에 불가능했던 것들(동기 측정, 즉각 반응, concurrent rendering)이 가능해졌다."** 성능 수치보다 이 구조적 가능성이 본질이다.

실무에서 이 용어를 만나는 맥락은 대부분 **호환성**이다. 라이브러리 README나 이슈에서 "New Architecture support"를 확인하는 것이 라이브러리 선정의 기본 체크리스트가 되었다. 구식 라이브러리도 interop layer로 상당수 동작하지만, 유지보수가 멈춘 패키지는 여기서 탈락하는 경우가 많다.

반대로 2024년 이후 글을 읽을 때 "New Arch에서는 다르다"는 단서가 붙은 옛 성능 팁(예: "bridge 통신을 줄여라")은 걸러 읽어야 한다.

이 노트는 허브다 — 각 구성 요소의 동작 원리는 개별 노트([[JSI]], [[Fabric]], [[Turbo Module]], [[Codegen]], [[Bridgeless]])를 참고.

## 🔗 관련
[[JSI]] · [[Fabric]] · [[Turbo Module]] · [[Codegen]] · [[Bridgeless]] · [[Bridge]] · [[Shadow Tree]] · [[Hermes]]

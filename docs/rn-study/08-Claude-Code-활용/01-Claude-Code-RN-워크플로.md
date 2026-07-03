# Claude Code RN 워크플로

> RN을 배우면서, 그리고 RN으로 개발하면서 Claude Code를 어떻게 쓰는 게 효과적인가.

## 왜 RN에서 특히 중요한가

RN/Expo는 **버전 간 차이가 크고 옛 정보가 인터넷에 많이 남아 있는** 생태계다.
LLM이 학습한 옛 API(Expo Go 중심 워크플로, 구 아키텍처 Bridge API, Flipper 등)를
그대로 쓰는 사고를 막는 장치가 필수다. 이 레포가 쓰는 방법이 그 정답이다.

## 1. 버전 고정 문서를 AGENTS.md에 명시

이 레포의 [AGENTS.md](../../../AGENTS.md)가 이미 하고 있는 방식:

```markdown
# Expo HAS CHANGED
Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
```

- 버전 고정 URL(`/versions/v57.0.0/`)이 핵심. "latest"가 아니라 프로젝트 SDK 버전.
- RN 코어 문서도 마찬가지: 필요하면 `reactnative.dev/docs/x.y` 버전 경로 사용.
- SDK 업그레이드 시 이 URL 갱신을 잊지 말 것.

## 2. 프로젝트 계약 문서를 컨텍스트로

이 레포의 패턴: `docs/PROGRESS.md`(현재 상태) · `docs/FOUNDATION.md`(DS/네비 계약) ·
`docs/DATA_MODEL.md` · `docs/STORE.md`를 AGENTS.md에서 참조하게 해서,
Claude가 매 세션 프로젝트 규칙을 알고 시작하게 한다.

**학습 관점 활용**: 이 문서들 자체가 "RN 앱을 어떻게 구조화하는가"의 실례다.
새 RN 프로젝트를 시작하면 같은 문서 세트를 만들자.

## 3. 학습용 스킬 — rn-study

이 환경에는 `swift-study` 스킬(predict-first 학습 루프: 코드를 보여주고
결과를 먼저 예측하게 한 뒤 설명)이 이미 있다. 같은 구조로 **rn-study 스킬**을
만들면 이 vault 커리큘럼과 연동된다:

- `skill-creator` 스킬로 생성
- 스킬이 이 vault(`docs/rn-study/`)의 노트를 읽고 퀴즈/예측 문제를 내게 설계
- "오늘 배운 내용을 [[네이티브-개발자의-함정]] 노트에 추가해줘" 같은 마무리 루틴 포함

## 4. 에이전트 활용 패턴

| 상황 | 도구 | 예시 프롬프트 |
|---|---|---|
| 코드베이스 학습 질문 | Explore 에이전트 | "이 레포에서 Reanimated가 어디에 어떻게 쓰였는지 찾아서 설명해줘" |
| 구현 전 설계 학습 | Plan 모드 | 기능을 요청하고 계획만 먼저 받아서 RN 관용구를 관찰 |
| 내 코드 교정 | `/code-review`, `/simplify` | 네이티브식으로 짠 어색한 RN 코드를 교정받기 |
| 개념 정리 | 일반 대화 → 노트 생성 | "오늘 배운 X를 docs/rn-study 템플릿에 맞춰 노트로 정리해줘" |

**학습 팁**: 처음엔 Claude가 짠 코드를 그대로 받지 말고,
"왜 useCallback을 썼어?" "이거 useEffect 없이 되지 않아?"를 물어라.
답을 설명시키는 것이 가장 빠른 학습 루프다.

## 5. 검증 루프 자동화

RN에서 "동작 확인"은 시뮬레이터/실기기가 필요해 비용이 크다. 줄이는 방법:

- **타입체크를 1차 게이트로**: `npx tsc --noEmit` — JS는 컴파일러가 없어서
  네이티브 개발자가 잃는 안전망을 TS가 되찾아준다. 훅(hooks)으로 자동화 가능(`update-config` 스킬).
- **ESLint**: `eslint-config-expo` 기반. Rules of Hooks 위반을 잡아준다.
- **실기기 확인**: 이 레포는 Expo Go 불가(SDK 57) → dev build 필수.
  절차는 [DEVICE_TESTING.md](../../DEVICE_TESTING.md) 참고.

## 6. 흔한 안티패턴

- **버전 미명시 질문**: "RN에서 X 어떻게 해?"보다 "Expo SDK 57에서 X 어떻게 해?"가
  옛 API 답변을 원천 차단한다.
- **에러 메시지만 던지기**: RN 에러는 JS 층/네이티브 층/빌드 층 중 어디인지가 중요.
  "Metro 로그인지 Xcode 빌드 로그인지"를 함께 줘라.
- **node_modules 수정 제안 수락**: 올바른 경로는 patch-package/pnpm patch.
  Claude가 제안해도 거절하고 정석을 요구할 것.

## 관련 노트

[[Expo Go]] · [[Dev Client]] · [[EAS]] · [99-실습-프로젝트](../99-실습-프로젝트/README.md)

# Logit — 개인 기록 앱 (React Native / Expo)

`Logit.dc.html` 디자인 문서(섹션 01~08)를 소스 오브 트루스로, **Expo SDK 57 + React Native 0.86 + React 19**
환경에 재현한 모바일 앱. 디자인 토큰·컴포넌트·화면을 픽셀 단위로 이식했다. 폰 프레임 베젤/상태바
목업은 문서용이므로 제외(README 지침).

## 실행
```bash
npm install
npm run ios        # 또는 android
npm run web        # 브라우저 미리보기 (react-native-web)
```

## 구조
```
App.tsx                     ThemeProvider + SafeArea + RootNavigator
src/theme/
  tokens.ts                 Light/Dark 팔레트, radius/spacing/type, templateColor, withAlpha (color-mix 대체)
  ThemeContext.tsx          useTheme() — 시스템 스킴 추종 + 수동 토글
src/components/             디자인 시스템 §07 1:1 이식
  Glyph.tsx                 stroke SVG 프리미티브 + 공용 아이콘 레지스트리(Icon.*)
  primitives.tsx            Screen / T / Row / Divider
  Button.tsx                Button(5 variant) / IconButton / Fab
  cards.tsx                 ActivityCard / PlanCard / StatCard
  Rating.tsx                Stars / RatingInput / CompanionChip
  badges.tsx                SyncStatusBadge / DdayBadge / Tag
  controls.tsx              Toggle / Segmented / Stepper / Chip
  Field.tsx                 Field / DisclosureButton / SettingsRow
  FormHeader.tsx            기록 폼 모달 헤더(취소/아이콘+제목/저장=템플릿색)
  EmptyState.tsx
src/data/activities.ts      활동→템플릿·아이콘 레지스트리, colorsFor/iconFor
src/navigation/             BottomTabBar(중앙 FAB) + RootNavigator(탭 + 모달 스택)
src/screens/                화면 21종 (아래)
docs/FOUNDATION.md          구현 계약(컴포넌트/토큰/네비 API)
```

## 화면 (디자인 문서 섹션 대응)
| 섹션 | 화면 | 파일 |
|---|---|---|
| 1.1 / 1.2 | 홈 / 홈 빈 상태 | `HomeScreen` / `HomeEmptyScreen` |
| 1.3 | 활동 선택 | `ActivitySelectScreen` |
| 2·3 | 기록 폼(5 템플릿) | `RecordFormScreen` → `forms/{Endurance,SetRep,Match,Spectate,Free}Form` |
| 4.1–4.5 | 활동 상세(런닝/축구/야구/뮤지컬/연극) | `DetailScreen` (activity 파라미터로 분기) |
| 4.6 / 4.7 | 통계 / 통계 빈 상태 | `StatsScreen` / `StatsEmptyScreen` |
| 4.8 | 설정 | `SettingsScreen` (테마 토글 연동) |
| 5.1 | 월간 캘린더 | `CalendarScreen` |
| 5.2 / 5.3 | 다가오는 약속 / 약속 추가 | `PlansScreen` / `AddPlanScreen` |
| 6.1 | 활동 직접 추가 | `AddActivityScreen` |

## 정보 구조 (문서 결정 반영)
종목은 고정 그룹이 아닌 **기록 템플릿 5종**(endurance/setrep/match/spectate/free)으로 묶고,
활동은 평평한 확장 목록. `activities` 레지스트리에 항목만 추가하면 폼·통계·캘린더에 즉시 반영.
MatchForm은 팀/개인 구분 없이 종목 칩으로 "핵심 기록 슬롯"만 교체(하드코딩 토글 없음).

## 알려진 단순화 (ponytail)
- 로컬 상태만 사용(오프라인 DB/동기화 큐는 미구현 — SyncStatusBadge는 표시용). 실데이터 연동 시 WatermelonDB/SQLite.
- 사진은 그라디언트 플레이스홀더, HealthKit/Health Connect는 "준비 중" placeholder(문서와 동일).
- 화면별 샘플 데이터는 디자인 문서의 문자열을 그대로 인라인.

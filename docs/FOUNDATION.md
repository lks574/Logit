# Logit RN — Foundation contract (read before implementing any screen)

Source of truth: `/Users/kyungseok.lee/Downloads/design_handoff_logit_mobile/Logit.dc.html`.
Each screen is a 322×696 phone mockup in that file. Reproduce the **content, layout,
colors, spacing, radii, typography faithfully** — but DO NOT render the phone-frame
bezel, notch bar, or the "9:41 + battery" status bar row (README: document-only).
Start the screen at the real content (the app header / title row).

## Theme
```ts
import { useTheme } from '../theme/ThemeContext';   // from screens/  (../theme)
const { c, scheme, toggle } = useTheme();
```
`c` is the palette. Keys (camelCase of the CSS vars):
`boardBg,bg,surface,surfaceAlt,border,text,text2,text3,accent,accentSoft,cardio,cardioSoft,strength,strengthSoft,team,teamSoft,perf,perfSoft,success,warning,error,star`.

- `var(--accent)` → `c.accent`, `var(--surface-alt)` → `c.surfaceAlt`, etc.
- `color-mix(in srgb, X N%, transparent)` → `withAlpha(c.X, N)` from `../theme/tokens`.
- Radii: `radius.sm=8, md=14, lg=20, xl=28, card=14` from `../theme/tokens`.
- Template colors: `templateColor` + `colorsFor(template, c)` from `../data/activities`.

## Primitives (`../components/primitives`)
- `<Screen scroll bg edges contentStyle>` — SafeAreaView + optional ScrollView. Use for
  every full screen. Default bg = `c.bg`. For screens WITH a bottom tab bar (Home, Calendar,
  Stats, My) the tab bar is provided by the navigator — do NOT add one; just don't set
  bottom edge padding that fights it (use `edges={['top']}`). Modal/pushed screens
  (forms, detail, add*) have their own header row and no tab bar.
- `<T>` themed Text (default color c.text; pass `c="..."` to override). `<Row gap between center>`. `<Divider>`.

## Glyph / Icons (`../components/Glyph`)
- Named registry: `Icon.plus, chevronRight, chevronLeft, chevronDown, close, check, search,
  home, calendar, chart, settings, edit, user, mail, trash, bell, refresh, logo, running, dumbbell,
  soccer, baseball, badminton, tennis, pingpong, jiujitsu, yoga, book, performance, tent, mappin, utensils`.
  Usage: `<Icon.plus size={18} color={c.accent} strokeWidth={2.4} />`.
- One-off icons NOT in the registry: inline the SVG paths with `Glyph`:
  ```tsx
  import { Glyph, Path, Circle, Rect } from '../components/Glyph';
  <Glyph size={18} color={c.text2}><Path d="M4 5h16M4 12h16M4 19h16" /></Glyph>
  ```
  Copy the exact `<path d="…"/>` from the HTML slice. Default viewBox 24×24, stroke-linecap/join round.

## Components
- `Button` (`../components/Button`): `<Button label onPress variant icon fullWidth small />`
  variant = primary|secondary|ghost|destructive|disabled. Also `IconButton`, `Fab`.
- `ActivityCard, PlanCard, StatCard` (`../components/cards`):
  - `ActivityCard {color, soft, icon, title, time?, meta?, ratingFilled?, memo?, bg?, onPress?}`
    (left 4px color bar). `color`/`soft` are resolved hex (use `colorsFor`).
  - `PlanCard {icon, title, meta?, tag?, onCheck?, onPress?}` (dashed accent card).
  - `StatCard {cells:[{value,label,valueColor?,unit?}], bg?}` (N-cell metric row).
- `Stars {filled,total?,size?}`, `RatingInput {value,onChange}`, `CompanionChip {name,dashed?}` (`../components/Rating`).
- `SyncStatusBadge {state:'synced'|'pending'|'offline'}`, `DdayBadge {days,color?}`, `Tag {label,color,soft?,outline?}` (`../components/badges`).
- `Toggle, Segmented, Stepper, Chip` (`../components/controls`).
- `Field {label,required?,value?,onChangeText?,placeholder?,large?}`, `DisclosureButton`, `SettingsRow` (`../components/Field`).
- `EmptyState {icon,title,subtitle?,cta?}` (`../components/EmptyState`).
- `FormHeader {title,icon,color,soft,onCancel?,onSave?}` (`../components/FormHeader`) — record-form
  modal header (취소 / icon+title / 저장 in template color). Defaults: cancel→goBack, save→MainTabs.

Prefer these components; only build inline views for layout the components don't cover.
It's fine to compose/extend. Match paddings from the HTML (content padding 16–18, card gap 14).

## Navigation (`../navigation/types` → RootStackParamList / TabParamList)
```ts
import { useNavigation } from '@react-navigation/native';
const nav = useNavigation<any>();
nav.navigate('Detail', { activity: '런닝' });
nav.goBack();
```
Routes: MainTabs (tabs: Home,Calendar,Add,Stats,My), ActivitySelect, RecordForm{activity,template,recordId?,planId?},
Detail{activity,recordId?}, AddPlan, AddActivity, Plans, ProfileEdit, Settings, Feedback, Roadmap, CategoryStats, VerifyEmail.
- 하단탭 '마이'(우상단 기어→Settings). 딥링크: `linking` 설정(`logit://record/:recordId` 등) — `src/navigation/linking.ts`.
- FAB / "기록 추가" CTA → `nav.navigate('ActivitySelect')`.
- Activity tile tap in ActivitySelect → `nav.navigate('RecordForm', {activity, template})`.
- Cancel/close (취소 / ✕) in modal → `nav.goBack()`.
- Save (저장) → `nav.navigate('MainTabs')` (or goBack).
- Home "캘린더 ›" / "다가오는 약속" more → `nav.navigate('Plans')` or Calendar tab.

## Data (`../data/activities`)
`activities[name] -> {name, template, icon}`; `colorsFor(template, c) -> {color, soft}`;
`iconFor(name) -> Icon component`. Templates: endurance|setrep|match|spectate|free.
For screen-local sample content, copy the literal Korean text/numbers from the HTML slice.

## Rules
- TypeScript, functional components, `export default function ScreenName()`.
- Use `c.*` colors — never hardcode hex except `#fff`/`#000` where the HTML does.
- Multilingual-safe: flex + gap, `numberOfLines` for ellipsis, icons `flexShrink:0`. No fixed
  widths on text. Min touch target 44 (use hitSlop on small controls).
- Keep each screen self-contained in its own file. Do not edit shared component/theme files
  (if a component needs a new prop, work around it locally instead).

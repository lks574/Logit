import React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, T, Row } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { NativeAdCard } from '../../components/NativeAdCard';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { activities, colorsFor, activityLabel } from '../../data/activities';
import { TemplateType } from '../../theme/tokens';
import { useStore } from '../../store/StoreContext';
import { Msg, tr } from '../../i18n/i18n';

// 템플릿별 섹션 — 목록은 카탈로그(activities)에서 자동 그룹핑한다(누락 방지·자동 반영).
const SECTIONS: { template: TemplateType; label: Msg; hint?: Msg }[] = [
  { template: 'endurance', label: { en: 'Cardio', ko: '유산소' }, hint: { en: '· distance · time', ko: '· 거리·시간형' } },
  { template: 'setrep', label: { en: 'Strength', ko: '근력' }, hint: { en: '· sets · reps', ko: '· 세트·횟수형' } },
  { template: 'match', label: { en: 'Match', ko: '대전·경기형' }, hint: { en: '· sports with opponents', ko: '· 상대 있는 종목' } },
  { template: 'spectate', label: { en: 'Performance', ko: '공연·관람형' }, hint: { en: '· musical · play · concert', ko: '· 뮤지컬·연극·콘서트' } },
  { template: 'outing', label: { en: 'Leisure & outings', ko: '여가·나들이' }, hint: { en: '· camping · travel · dining', ko: '· 캠핑·여행·맛집' } },
  { template: 'free', label: { en: 'Free record', ko: '자유 기록형' } },
];

export default function ActivitySelectScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { customActivities, records } = useStore();

  // 이름 → 템플릿/아이콘 (빌트인 없으면 커스텀, 그래도 없으면 기본값). 최근 사용에 커스텀도 섞이므로 필요.
  const templateOf = (name: string): TemplateType =>
    activities[name]?.template ?? customActivities.find((a) => a.name === name)?.template ?? 'free';
  const iconOf = (name: string) => (activities[name] ? Icon[activities[name].icon] : Icon.yoga);

  // 최근 사용 — 기록에서 최근순·중복 제거, 최대 5개.
  const recent = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of records) {
      if (!seen.has(r.activity)) {
        seen.add(r.activity);
        out.push(r.activity);
      }
      if (out.length >= 5) break;
    }
    return out;
  }, [records]);

  // 카탈로그를 템플릿별로 묶는다(등록 순서 유지).
  const grouped = React.useMemo(() => {
    const g: Partial<Record<TemplateType, string[]>> = {};
    Object.values(activities).forEach((a) => {
      (g[a.template] ??= []).push(a.name);
    });
    return g;
  }, []);

  // 기록/약속 선택 — 선택한 활동을 어느 폼으로 보낼지 결정.
  const [mode, setMode] = React.useState<'record' | 'plan'>('record');
  // 섹션 접힘 상태: 자주 쓰는은 항상 펼침, 나머지는 기본 닫힘(키별 토글).
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const [query, setQuery] = React.useState('');
  const q = query.trim();

  // 검색 결과 — 카탈로그 + 내 활동에서 이름 부분일치(중복 제거).
  const results = React.useMemo(() => {
    if (!q) return [] as { name: string; template: TemplateType; custom: boolean }[];
    const seen = new Set<string>();
    const out: { name: string; template: TemplateType; custom: boolean }[] = [];
    Object.values(activities).forEach((a) => {
      if (a.name.includes(q) && !seen.has(a.name)) {
        seen.add(a.name);
        out.push({ name: a.name, template: a.template, custom: false });
      }
    });
    customActivities.forEach((a) => {
      if (a.name.includes(q) && !seen.has(a.name)) {
        seen.add(a.name);
        out.push({ name: a.name, template: a.template, custom: true });
      }
    });
    return out;
  }, [q, customActivities]);

  // 기록 모드 → RecordForm, 약속 모드 → AddPlan(활동 프리필).
  const go = (name: string, template: TemplateType) =>
    mode === 'plan'
      ? nav.navigate('AddPlan', { activity: name })
      : nav.navigate('RecordForm', { activity: name, template });

  // 최근 사용 pill (좌우 스크롤 행) — 커스텀 활동도 처리, 내용 크기로 배치.
  const Pill = ({ name }: { name: string }) => {
    const tmpl = templateOf(name);
    const { color, soft } = colorsFor(tmpl, c);
    const Ico = iconOf(name);
    return (
      <Pressable
        onPress={() => go(name, tmpl)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={14} color={color} />
        </View>
        <T style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {activityLabel(name)}
        </T>
      </Pressable>
    );
  };

  // Grid tile (3-col). `selected` renders the team-soft bg + border variant.
  const Tile = ({ name, selected }: { name: string; selected?: boolean }) => {
    const a = activities[name];
    const { color, soft } = colorsFor(a.template, c);
    const Ico = Icon[a.icon];
    return (
      <Pressable
        onPress={() => go(name, a.template)}
        style={{
          flex: 1,
          alignItems: 'center',
          gap: 6,
          backgroundColor: selected ? soft : c.surface,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? color : c.border,
          borderRadius: 12,
          paddingVertical: 11,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: selected ? c.surface : soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={17} color={color} />
        </View>
        <T
          style={{ fontSize: 11.5, fontWeight: selected ? '700' : '600' }}
          numberOfLines={1}
        >
          {activityLabel(name)}
        </T>
      </Pressable>
    );
  };

  // Grid tile for a user-added custom activity: resolve color from its template
  // and fall back to a default icon when the name isn't in the builtin registry.
  const CustomTile = ({ name, template }: { name: string; template: TemplateType }) => {
    const { color, soft } = colorsFor(template, c);
    const Ico = activities[name] ? Icon[activities[name].icon] : Icon.yoga;
    return (
      <Pressable
        onPress={() => go(name, template)}
        style={{
          flex: 1,
          alignItems: 'center',
          gap: 6,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          paddingVertical: 11,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={17} color={color} />
        </View>
        <T style={{ fontSize: 11.5, fontWeight: '600' }} numberOfLines={1}>
          {activityLabel(name)}
        </T>
      </Pressable>
    );
  };

  // "＋직접 추가" dashed accent tile.
  const AddTile = () => (
    <Pressable
      onPress={() => nav.navigate('AddActivity')}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: c.surface,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: withAlpha(c.accent, 45),
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 4,
      }}
    >
      <Icon.plus size={18} color={c.accent} strokeWidth={2.2} />
      <T style={{ fontSize: 11.5, fontWeight: '700' }} c={c.accent}>
        {tr({ en: 'Add own', ko: '직접 추가' })}
      </T>
    </Pressable>
  );

  const SectionDot = ({ color }: { color: string }) => (
    <View
      style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }}
    />
  );

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header row */}
      <Row
        between
        center
        style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 }}
      >
        <T style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }}>
          {mode === 'plan'
            ? tr({ en: 'What do you want to plan?', ko: '무엇을 약속할까요?' })
            : tr({ en: 'What do you want to log?', ko: '무엇을 기록할까요?' })}
        </T>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon.close size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
      </Row>

      {/* 기록 / 약속 선택 — 검색부 위 */}
      <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
        <Segmented<'record' | 'plan'>
          options={[
            { key: 'record', label: tr({ en: 'Record', ko: '기록' }) },
            { key: 'plan', label: tr({ en: 'Plan', ko: '약속' }) },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {/* Search field */}
      <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
        <Row
          center
          gap={9}
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: q ? c.accent : c.border,
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <Icon.search size={17} color={c.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={tr({ en: 'Search activities · Badminton, Yoga…', ko: '종목 검색 · 배드민턴, 요가…' })}
            placeholderTextColor={c.text3}
            autoCorrect={false}
            style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
          />
          {q ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon.close size={16} color={c.text3} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </Row>
      </View>

      {/* Sections / 검색 결과 */}
      <View style={{ paddingHorizontal: 18, gap: 15 }}>
        {q ? (
          <View style={{ gap: 6 }}>
            <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
              {tr({ en: 'Search results', ko: '검색 결과' })}{results.length > 0 ? ` · ${results.length}` : ''}
            </T>
            {results.length === 0 ? (
              <T style={{ fontSize: 13, paddingVertical: 8 }} c={c.text3}>
                {tr({ en: `No activity matches '${q}'. Create one with Add own below.`, ko: `'${q}'에 맞는 종목이 없어요. 아래 직접 추가로 만들 수 있어요.` })}
              </T>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {results.map((r) => (
                <View key={r.name} style={{ width: '31%' }}>
                  {r.custom ? (
                    <CustomTile name={r.name} template={r.template} />
                  ) : (
                    <Tile name={r.name} />
                  )}
                </View>
              ))}
              <View style={{ width: '31%' }}>
                <AddTile />
              </View>
            </View>
          </View>
        ) : (
          <>
        {/* 최근 사용 — 최근 기록순 최대 5개, 1줄 좌우 스크롤 */}
        {recent.length > 0 ? (
          <View>
            <T
              style={{ fontSize: 12, fontWeight: '600', marginBottom: 8 }}
              c={c.text2}
            >
              {tr({ en: 'Recently used', ko: '최근 사용' })}
            </T>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {recent.map((name) => (
                <Pill key={name} name={name} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 템플릿별 섹션 — 기본 닫힘, 헤더 탭으로 펼침. 마지막 섹션에 "직접 추가" 타일. */}
        {SECTIONS.map((sec, si) => {
          const names = grouped[sec.template] ?? [];
          const isLast = si === SECTIONS.length - 1;
          if (names.length === 0 && !isLast) return null;
          const open = !!expanded[sec.template];
          return (
            <View key={sec.template} style={{ gap: 6 }}>
              <Pressable onPress={() => toggle(sec.template)} hitSlop={{ top: 8, bottom: 8 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 }}>
                <SectionDot color={colorsFor(sec.template, c).color} />
                <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
                  {tr(sec.label)}
                </T>
                {sec.hint ? (
                  <T style={{ fontSize: 11 }} c={c.text3}>
                    {tr(sec.hint)}
                  </T>
                ) : null}
                <View style={{ flex: 1 }} />
                <T style={{ fontSize: 11 }} c={c.text3}>{names.length}</T>
                {open ? (
                  <Icon.chevronDown size={15} color={c.text3} strokeWidth={2.4} />
                ) : (
                  <Icon.chevronRight size={15} color={c.text3} strokeWidth={2.4} />
                )}
              </Pressable>
              {open ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {names.map((name) => (
                    <View key={name} style={{ width: '31%' }}>
                      <Tile name={name} />
                    </View>
                  ))}
                  {isLast ? (
                    <View style={{ width: '31%' }}>
                      <AddTile />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* 내 활동 — user-added custom activities from the store (기본 닫힘) */}
        {customActivities.length > 0 ? (
          (() => {
            const open = !!expanded.custom;
            return (
              <View style={{ gap: 6 }}>
                <Pressable onPress={() => toggle('custom')} hitSlop={{ top: 8, bottom: 8 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 }}>
                  <SectionDot color={c.text2} />
                  <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
                    {tr({ en: 'My activities', ko: '내 활동' })}
                  </T>
                  <View style={{ flex: 1 }} />
                  <T style={{ fontSize: 11 }} c={c.text3}>{customActivities.length}</T>
                  {open ? (
                    <Icon.chevronDown size={15} color={c.text3} strokeWidth={2.4} />
                  ) : (
                    <Icon.chevronRight size={15} color={c.text3} strokeWidth={2.4} />
                  )}
                </Pressable>
                {open ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {customActivities.map((a) => (
                      <View key={a.name} style={{ width: '31%' }}>
                        <CustomTile name={a.name} template={a.template} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })()
        ) : null}
          </>
        )}
        <NativeAdCard />
      </View>
    </Screen>
  );
}

import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { PrimaryButton } from '../../components/auth-ui';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { statsHub, StatsCategory } from '../../store/selectors';
import { TemplateType } from '../../theme/tokens';
import { activities, colorsFor, activityLabel } from '../../data/activities';
import { tr, Msg } from '../../i18n/i18n';

// #RRGGBB 두 색을 pct%로 섞음(color-mix 대체) — 히트맵 레벨 색.
function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

// 기록 템플릿 → 통계 카테고리(세부 화면 라우팅용).
const TEMPLATE_CATEGORY: Record<TemplateType, StatsCategory> = {
  endurance: 'cardio',
  setrep: 'strength',
  match: 'match',
  spectate: 'performance',
  outing: 'outing',
  free: 'free',
};
// 활동별 리스트 섹션 — 기록추가 화면과 동일한 템플릿 그룹핑.
const SECTIONS: { template: TemplateType; label: Msg }[] = [
  { template: 'endurance', label: { en: 'Cardio', ko: '유산소' } },
  { template: 'setrep', label: { en: 'Strength', ko: '근력' } },
  { template: 'match', label: { en: 'Match', ko: '대전' } },
  { template: 'spectate', label: { en: 'Performance', ko: '공연' } },
  { template: 'outing', label: { en: 'Leisure', ko: '여가' } },
  { template: 'free', label: { en: 'Free', ko: '자유' } },
];

export default function StatsScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { records, customActivities, today } = useStore();
  const hub = statsHub(records, 'all', today);

  const heatColor = (level: number) =>
    level === 0 ? c.surfaceAlt : level === 1 ? mix(c.accent, c.surfaceAlt, 30) : level === 2 ? mix(c.accent, c.surfaceAlt, 55) : c.accent;

  // 기록이 있는 활동을 템플릿별로 묶어 횟수 내림차순.
  const grouped = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) counts[r.activity] = (counts[r.activity] ?? 0) + 1;
    const g: Partial<Record<TemplateType, { name: string; count: number }[]>> = {};
    Object.keys(counts).forEach((name) => {
      const tmpl = activities[name]?.template ?? customActivities.find((a) => a.name === name)?.template ?? 'free';
      (g[tmpl] ??= []).push({ name, count: counts[name] });
    });
    Object.values(g).forEach((arr) => arr!.sort((a, b) => b.count - a.count));
    return g;
  }, [records, customActivities]);

  const iconOf = (name: string) => (activities[name] ? Icon[activities[name].icon] : Icon.yoga);

  // 완전 빈 상태
  if (records.length === 0) {
    return (
      <Screen edges={['top']} contentStyle={{ flex: 1, paddingHorizontal: 26 }}>
        <View style={{ paddingTop: 8, paddingBottom: 14 }}>
          <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>{tr({ en: 'Stats', ko: '통계' })}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Glyph size={40} color={c.accent} strokeWidth={2}>
              <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            </Glyph>
          </View>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{tr({ en: 'Not much to show yet', ko: '아직 통계가 적어요' })}</Text>
            <Text style={{ fontSize: 12.5, color: c.text2, textAlign: 'center', lineHeight: 18 }}>
              {tr({ en: 'Log activities to see your summary\nand stats by activity here.', ko: '기록을 쌓으면 활동 요약과 활동별 통계를\n여기서 볼 수 있어요.' })}
            </Text>
          </View>
          <View style={{ width: '100%', maxWidth: 240 }}>
            <PrimaryButton label={tr({ en: 'Add a record', ko: '기록 추가하기' })} onPress={() => nav.navigate('ActivitySelect')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 }}>
        <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>{tr({ en: 'Stats', ko: '통계' })}</Text>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 9 }}>
        {/* 전체 활동 요약 */}
        <View style={{ backgroundColor: c.accent, borderRadius: 16, padding: 14 }}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{tr({ en: 'All time', ko: '전체 활동' })}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 15, marginTop: 8 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>{hub.count}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{tr({ en: 'Records', ko: '기록' })}</Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View>
              <Text style={{ fontSize: 21, fontWeight: '700', color: '#fff' }}>
                {hub.activeDays}<Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{tr({ en: 'd', ko: '일' })}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{tr({ en: 'Active days', ko: '활동일' })}</Text>
            </View>
            <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 21, fontWeight: '700', color: '#fff' }}>🔥 {hub.streak}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{tr({ en: 'Streak', ko: '연속 기록' })}</Text>
            </View>
          </View>
        </View>

        {/* 활동 캘린더 */}
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'Activity calendar', ko: '활동 캘린더' })}</Text>
            <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: 'Last 5 weeks', ko: '최근 5주' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {hub.heatmap.map((cell) => (
              <Pressable
                key={cell.date}
                disabled={cell.future}
                onPress={() => nav.navigate('Calendar', { dateISO: cell.date })}
                style={{ width: `${(100 - 5 * 6) / 7}%`, height: 11, borderRadius: 3, backgroundColor: cell.future ? 'transparent' : heatColor(cell.level) }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: c.text3 }}>{tr({ en: 'Less', ko: '적음' })}</Text>
            {[0, 1, 2, 3].map((l) => (
              <View key={l} style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: heatColor(l) }} />
            ))}
            <Text style={{ fontSize: 10, color: c.text3 }}>{tr({ en: 'More', ko: '많음' })}</Text>
          </View>
        </View>

        {/* 활동별 — 기록추가 화면처럼 템플릿 그룹 + 활동 타일. 탭 → 활동 세부 통계 */}
        <View style={{ marginTop: 2, gap: 14 }}>
          <View style={{ marginHorizontal: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By activity', ko: '활동별' })}</Text>
          </View>
          {SECTIONS.map((sec) => {
            const items = grouped[sec.template] ?? [];
            if (items.length === 0) return null;
            const { color, soft } = colorsFor(sec.template, c);
            return (
              <View key={sec.template} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{tr(sec.label)}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 11, color: c.text3 }}>{items.length}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {items.map((it) => {
                    const Ico = iconOf(it.name);
                    return (
                      <View key={it.name} style={{ width: '31%' }}>
                        <Pressable
                          onPress={() => nav.navigate('CategoryStats', { category: TEMPLATE_CATEGORY[sec.template], activity: it.name })}
                          style={{ flex: 1, alignItems: 'center', gap: 5, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 4 }}
                        >
                          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
                            <Ico size={17} color={color} />
                          </View>
                          <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '600', color: c.text }}>{activityLabel(it.name)}</Text>
                          <Text style={{ fontSize: 10, color: c.text3 }}>{tr({ en: `${it.count}×`, ko: `${it.count}회` })}</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

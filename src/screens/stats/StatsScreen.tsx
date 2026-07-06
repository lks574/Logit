import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Circle, Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { PrimaryButton } from '../../components/auth-ui';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { statsHub, StatsPeriod, StatsCategory } from '../../store/selectors';
import { tr, Msg } from '../../i18n/i18n';

// #RRGGBB 두 색을 pct%로 섞음(color-mix 대체).
function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

const CAT_META: { key: StatsCategory; label: Msg; sub: Msg; icon: React.ReactNode }[] = [
  { key: 'cardio', label: { en: 'Cardio', ko: '유산소' }, sub: { en: 'Running · Cycling · Swimming', ko: '러닝 · 사이클 · 수영' }, icon: <Path d="M3 18l5-9 4 5 3-4 6 8" /> },
  { key: 'strength', label: { en: 'Strength', ko: '근력' }, sub: { en: 'Weights · Bodyweight', ko: '웨이트 · 맨몸' }, icon: <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" /> },
  { key: 'match', label: { en: 'Match', ko: '대전' }, sub: { en: 'Soccer · Baseball · Racket', ko: '축구 · 야구 · 라켓' }, icon: (<><Circle cx="12" cy="12" r="8" /><Circle cx="12" cy="12" r="3" /></>) },
  { key: 'performance', label: { en: 'Shows', ko: '공연' }, sub: { en: 'Musical · Play · Concert', ko: '뮤지컬 · 연극 · 콘서트' }, icon: <Path d="M5 4h14v6a7 7 0 0 1-14 0z" /> },
  { key: 'free', label: { en: 'Free', ko: '자유' }, sub: { en: 'Yoga · Reading · Notes', ko: '요가 · 독서 · 메모' }, icon: <Path d="M4 20h4L18 10l-4-4L4 16v4zM13 5l4 4" /> },
];

export default function StatsScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { records, today } = useStore();
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const hub = statsHub(records, period, today);

  const catColor = (k: StatsCategory) =>
    k === 'cardio'
      ? { c: c.cardio, s: c.cardioSoft }
      : k === 'strength'
        ? { c: c.strength, s: c.strengthSoft }
        : k === 'match'
          ? { c: c.team, s: c.teamSoft }
          : k === 'performance'
            ? { c: c.perf, s: c.perfSoft }
            : { c: c.accent, s: c.accentSoft };
  const heatColor = (level: number) =>
    level === 0 ? c.surfaceAlt : level === 1 ? mix(c.accent, c.surfaceAlt, 30) : level === 2 ? mix(c.accent, c.surfaceAlt, 55) : c.accent;

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
              {tr({ en: 'Log activities to see your summary\nand stats by category here.', ko: '기록을 쌓으면 활동 요약과 종목별 통계를\n여기서 볼 수 있어요.' })}
            </Text>
          </View>
          <View style={{ width: '100%', maxWidth: 240 }}>
            <PrimaryButton label={tr({ en: 'Add a record', ko: '기록 추가하기' })} onPress={() => nav.navigate('AddChooser')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>{tr({ en: 'Stats', ko: '통계' })}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>
              {period === 'all' ? tr({ en: 'All', ko: '전체' }) : period === 'year' ? today.slice(0, 4) : `${today.slice(0, 4)} ${hub.tag}`}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Segmented<StatsPeriod>
            options={[
              { key: 'all', label: tr({ en: 'All', ko: '전체' }) },
              { key: 'month', label: tr({ en: 'Monthly', ko: '월간' }) },
              { key: 'quarter', label: tr({ en: 'Quarterly', ko: '분기' }) },
              { key: 'year', label: tr({ en: 'Yearly', ko: '연간' }) },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 9 }}>
        {/* 요약 히어로 */}
        <View style={{ backgroundColor: c.accent, borderRadius: 16, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
              {period === 'month'
                ? tr({ en: 'This month', ko: '이번 달 활동' })
                : period === 'quarter'
                  ? tr({ en: 'This quarter', ko: '이번 분기 활동' })
                  : period === 'year'
                    ? tr({ en: 'This year', ko: '올해 활동' })
                    : tr({ en: 'All time', ko: '전체 활동' })}
            </Text>
            <Text style={{ fontSize: 11, color: '#fff', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, overflow: 'hidden' }}>{hub.tag}</Text>
          </View>
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

        {/* 활동 히트맵 */}
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

        {/* 종목별 */}
        <View style={{ marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By category', ko: '종목별' })}</Text>
            <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: 'Tap for details →', ko: '탭하면 세부 통계 →' })}</Text>
          </View>
          <View style={{ gap: 8 }}>
            {CAT_META.map((cat) => {
              const data = hub.cats.find((x) => x.key === cat.key)!;
              const col = catColor(cat.key);
              const maxSpark = Math.max(1, ...data.spark);
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => nav.navigate('CategoryStats', { category: cat.key, period })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 11, paddingHorizontal: 13 }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: col.s, alignItems: 'center', justifyContent: 'center' }}>
                    <Glyph size={18} color={col.c} strokeWidth={2}>{cat.icon}</Glyph>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr(cat.label)}</Text>
                    <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{data.subtitle}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 }}>
                    {data.spark.map((v, i) => (
                      <View key={i} style={{ width: 4, height: Math.max(4, Math.round((v / maxSpark) * 22)) || 4, borderRadius: 2, backgroundColor: v > 0 ? mix(col.c, col.s, 40 + Math.round((v / maxSpark) * 60)) : col.s }} />
                    ))}
                  </View>
                  <Icon.chevronRight size={18} color={c.text3} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}

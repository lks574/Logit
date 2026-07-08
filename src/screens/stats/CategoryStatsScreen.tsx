import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { recentRecords, subtypeSections, StatsPeriod, StatsCategory } from '../../store/selectors';
import { tr, Msg } from '../../i18n/i18n';
import { activityLabel } from '../../data/activities';
import { Stars } from '../../components/Rating';

function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

const META: Record<StatsCategory, { label: Msg; sub: Msg }> = {
  cardio: { label: { en: 'Cardio', ko: '유산소' }, sub: { en: 'Running · Cycling · Swimming', ko: '러닝 · 사이클 · 수영' } },
  strength: { label: { en: 'Strength', ko: '근력' }, sub: { en: 'Weights · Bodyweight', ko: '웨이트 · 맨몸' } },
  match: { label: { en: 'Match', ko: '대전' }, sub: { en: 'Soccer · Baseball · Racket', ko: '축구 · 야구 · 라켓' } },
  performance: { label: { en: 'Shows', ko: '공연' }, sub: { en: 'Musical · Play · Concert', ko: '뮤지컬 · 연극 · 콘서트' } },
  outing: { label: { en: 'Leisure', ko: '여가' }, sub: { en: 'Camping · Travel · Dining', ko: '캠핑 · 여행 · 맛집' } },
  free: { label: { en: 'Free', ko: '자유' }, sub: { en: 'Yoga · Reading · Notes', ko: '요가 · 독서 · 메모' } },
};

// 단독 세부 통계 — 종목(장르/활동) 하나로 좁힌 화면. 요약 스트립·랭킹·2단 카드·최신순 기록.
export default function CategoryStatsScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { category, period: initialPeriod, activity } = useRoute().params as {
    category: StatsCategory;
    period?: StatsPeriod;
    activity: string;
  };
  const { records, today } = useStore();
  // 허브에서 넘어온 기간을 그대로 이어받는다(없으면 전체).
  const [period, setPeriod] = useState<StatsPeriod>(initialPeriod ?? 'all');
  const recent = recentRecords(records, category, period, today, activity);
  const [shown, setShown] = useState(4);
  // 별점이 있는 기록이면 최신순/별점순 정렬 토글 노출.
  const hasRatings = recent.some((r) => !!r.rating);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const sortedRecent = sortBy === 'rating'
    ? [...recent].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.dateISO < b.dateISO ? 1 : -1))
    : recent;
  // 방문/관람 횟수 배지 — 같은 대상의 몇 번째 기록인지(1회는 숨김, 2부터 표시).
  const baseTitle = (str?: string) => (str ?? '').replace(/\s*\(\d+\)\s*$/, '').trim();
  const revisitKey = (r: any) => (category === 'performance' ? baseTitle(r.fields?.작품) : (r.fields?.장소 ?? '').trim());
  const visitNo = (r: any) => {
    if (category !== 'performance' && category !== 'outing') return 1;
    const key = revisitKey(r);
    if (!key) return 1;
    // 이 기록 시점까지의 동일 대상 누적 수(같은 날짜는 id로 안정 정렬).
    return records.filter(
      (o) => o.template === r.template && revisitKey(o) === key && (o.dateISO < r.dateISO || (o.dateISO === r.dateISO && o.id <= r.id)),
    ).length;
  };
  // 리치 섹션(요약 스트립·랭킹 게이지·2단 카드).
  const sections = subtypeSections(records, category, activity, period, today);

  const palette: Record<StatsCategory, { col: string; soft: string }> = {
    cardio: { col: c.cardio, soft: c.cardioSoft },
    strength: { col: c.strength, soft: c.strengthSoft },
    match: { col: c.team, soft: c.teamSoft },
    performance: { col: c.perf, soft: c.perfSoft },
    outing: { col: c.outing, soft: c.outingSoft },
    free: { col: c.accent, soft: c.accentSoft },
  };
  const { col, soft } = palette[category];
  const meta = META[category];

  const card = { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 11, paddingHorizontal: 12 } as const;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.chevronLeft size={17} color={c.text2} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: c.text }}>{activityLabel(activity)}</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>{tr(meta.label)}</Text>
        </View>
        <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: col }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 11 }}>
        <Segmented<StatsPeriod>
          options={[
            { key: 'all', label: tr({ en: 'All', ko: '전체' }) },
            { key: 'month', label: tr({ en: 'Month', ko: '월간' }) },
            { key: 'quarter', label: tr({ en: 'Quarter', ko: '분기' }) },
            { key: 'year', label: tr({ en: 'Year', ko: '연간' }) },
          ]}
          value={period}
          onChange={setPeriod}
          color={col}
        />

        {recent.length === 0 ? (
          <Text style={{ fontSize: 12.5, color: c.text3, paddingVertical: 12, textAlign: 'center' }}>{tr({ en: 'No records in this period.', ko: '이 기간에 기록이 없어요.' })}</Text>
        ) : null}

        {/* 요약 스트립 */}
        {sections.summary.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {sections.summary.map((m, i) => (
              <View key={i} style={{ flex: 1, ...card }}>
                <Text style={{ fontSize: 10.5, color: c.text2 }}>{m.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 3 }}>
                  <Text style={{ fontSize: 19, fontWeight: '700', color: c.text }}>{m.value}</Text>
                  {m.unit ? <Text style={{ fontSize: 10.5, color: c.text2, fontWeight: '500' }}>{m.unit}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* 랭킹 게이지 */}
        {sections.rank && sections.rank.rows.length > 0 ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{sections.rank.title}</Text>
              {sections.rank.caption ? <Text style={{ fontSize: 11, color: c.text3 }}>{sections.rank.caption}</Text> : null}
            </View>
            <View style={{ gap: 10 }}>
              {sections.rank.rows.slice(0, 5).map((r, i) => (
                <View key={r.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Text style={{ width: 14, fontSize: 11, fontWeight: '700', color: i === 0 ? col : c.text3 }}>{i + 1}</Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, fontWeight: '600', color: c.text }}>{r.name}</Text>
                  <View style={{ width: 96, height: 8, backgroundColor: c.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${r.pct}%`, height: '100%', backgroundColor: i === 0 ? col : mix(col, c.surface, 75), borderRadius: 4 }} />
                  </View>
                  <Text style={{ width: 26, textAlign: 'right', fontSize: 11, fontWeight: '700', color: c.text }}>{r.count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 2단 카드 */}
        {sections.cols.some((cl) => cl.rows.length > 0) ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {sections.cols.map((cl, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 13 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text, marginBottom: 8 }}>{cl.title}</Text>
                {cl.rows.length === 0 ? (
                  <Text style={{ fontSize: 11.5, color: c.text3 }}>—</Text>
                ) : (
                  <View style={{ gap: 6 }}>
                    {cl.rows.map((row, j) => (
                      <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 11.5, color: c.text2 }}>{row.label}</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: c.text }}>{row.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* 최신순 기록 — 100% 실데이터. */}
        {recent.length > 0 ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: `Records · ${recent.length}`, ko: `기록 · ${recent.length}건` })}</Text>
              {hasRatings ? (
                <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 2 }}>
                  {([['recent', tr({ en: 'Latest', ko: '최신순' })], ['rating', tr({ en: 'Rating', ko: '별점순' })]] as const).map(([key, label]) => (
                    <Pressable key={key} onPress={() => setSortBy(key)} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: sortBy === key ? c.surface : 'transparent' }}>
                      <Text style={{ fontSize: 11, fontWeight: sortBy === key ? '700' : '500', color: sortBy === key ? c.text : c.text2 }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: 'Latest', ko: '최신순' })}</Text>
              )}
            </View>
            {sortedRecent.slice(0, shown).map((r) => (
              <Pressable key={r.id} onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 12 }}>
                <View style={{ width: 38, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: c.text, lineHeight: 17 }}>{+r.dateISO.slice(8, 10)}</Text>
                  <Text style={{ fontSize: 9.5, color: c.text3 }}>{tr({ en: `${+r.dateISO.slice(5, 7)}M`, ko: `${+r.dateISO.slice(5, 7)}월` })}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                    {r.meta || r.fields?.작품 || r.fields?.장소 || r.fields?.지역 || activityLabel(r.activity)}
                  </Text>
                </View>
                {visitNo(r) >= 2 ? (
                  <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: col }}>{visitNo(r)}</Text>
                  </View>
                ) : null}
                {r.rating ? <Stars filled={r.rating} size={12} /> : null}
              </Pressable>
            ))}
            {recent.length > shown ? (
              <Pressable onPress={() => setShown((n) => n + 6)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{tr({ en: `Show ${recent.length - shown} more`, ko: `이전 기록 ${recent.length - shown}건 더 보기` })}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

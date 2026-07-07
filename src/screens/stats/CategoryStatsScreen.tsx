import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Polyline, Circle as SvgCircle } from 'react-native-svg';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { categoryStats, recentRecords, subtypeSections, subtypesForCategory, StatsPeriod, StatsCategory } from '../../store/selectors';
import { tr, Msg } from '../../i18n/i18n';
import { activityLabel, iconFor } from '../../data/activities';
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

export default function CategoryStatsScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { category, period: initialPeriod, activity } = useRoute().params as {
    category: StatsCategory;
    period?: StatsPeriod;
    activity?: string; // 단일 종목(장르/활동)으로 좁힐 때
  };
  const { records, today } = useStore();
  // 허브에서 넘어온 기간을 그대로 이어받는다(없으면 전체).
  const [period, setPeriod] = useState<StatsPeriod>(initialPeriod ?? 'all');
  const s = categoryStats(records, category, period, today, activity) as any;
  const drill = (act: string) => nav.push('CategoryStats', { category, period, activity: act });
  // 단독 세부(종목 하나)에서만 최신순 기록 리스트를 노출. 기본 4행 + 더보기.
  const recent = activity ? recentRecords(records, category, period, today, activity) : [];
  const [shown, setShown] = useState(4);
  // 별점이 있는 기록이면 최신순/별점순 정렬 토글 노출.
  const hasRatings = recent.some((r) => !!r.rating);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const sortedRecent = sortBy === 'rating'
    ? [...recent].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.dateISO < b.dateISO ? 1 : -1))
    : recent;
  // 단독 세부 리치 섹션(요약 스트립·랭킹 게이지·2단 카드).
  const sections = activity ? subtypeSections(records, category, activity, period, today) : null;
  // 유산소·근력 부모 화면에서만 "세부 종목" 리스트(공연·여가는 분포 카드가 그 역할).
  const subtypes = !activity && (category === 'cardio' || category === 'strength')
    ? subtypesForCategory(records, category, period, today)
    : [];

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
  const metric = (label: string, value: React.ReactNode) => (
    <View style={{ flex: 1, ...card }}>
      <Text style={{ fontSize: 11, color: c.text2 }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, marginTop: 3 }}>{value}</Text>
    </View>
  );
  const unit = (t: string) => <Text style={{ fontSize: 10, color: c.text2, fontWeight: '500' }}>{t}</Text>;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.chevronLeft size={17} color={c.text2} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: c.text }}>{activity ? activityLabel(activity) : tr(meta.label)}</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>{activity ? tr(meta.label) : tr(meta.sub)}</Text>
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

        {s.count === 0 ? (
          <Text style={{ fontSize: 12.5, color: c.text3, paddingVertical: 12, textAlign: 'center' }}>{tr({ en: 'No records in this period.', ko: '이 기간에 기록이 없어요.' })}</Text>
        ) : null}

        {/* ── 단독 세부: 요약 스트립 · 랭킹 게이지 · 2단 카드 ── */}
        {activity && sections ? (
          <>
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
          </>
        ) : null}

        {/* ── 유산소 ── */}
        {!activity && category === 'cardio' ? (
          <>
            {/* 월별 거리 */}
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'Monthly distance', ko: '월별 달린 거리' })}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: col }}>{tr({ en: `Total ${s.totalKm}km`, ko: `총 ${s.totalKm}km` })}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, height: 86 }}>
                {(() => {
                  const max = Math.max(1, ...s.monthlyKm.map((m: any) => m.km));
                  return s.monthlyKm.map((m: any) => (
                    <View key={m.month} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View style={{ width: '100%', height: m.km > 0 ? Math.round(20 + (m.km / max) * 56) : 4, borderRadius: 6, backgroundColor: m.active ? col : m.km > 0 ? mix(col, soft, 55) : soft }} />
                      <Text style={{ fontSize: 10, color: m.active ? c.text : c.text3, fontWeight: m.active ? '600' : '400' }}>{m.month}</Text>
                    </View>
                  ));
                })()}
              </View>
            </View>

            {/* 평균 페이스 추이 */}
            <PaceTrend paceLine={s.paceLine} color={col} c={c} />

            {/* 2×2 지표 */}
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Avg pace', ko: '평균 페이스' }), <>{s.avgPace ?? '—'}{s.avgPace ? unit('/km') : null}</>)}
              {metric(tr({ en: 'Avg HR', ko: '평균 심박' }), s.avgHr != null ? <>{s.avgHr}{unit('bpm')}</> : '—')}
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Longest', ko: '최장 거리' }), <>{s.maxKm}{unit('km')}</>)}
              {metric(tr({ en: 'Total time', ko: '총 운동 시간' }), <>{s.totalHours}{unit(tr({ en: 'h', ko: '시간' }))}</>)}
            </View>
          </>
        ) : null}

        {/* ── 근력 ── */}
        {!activity && category === 'strength' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Total volume', ko: '총 볼륨' }), <>{s.totalT}{unit('t')}</>)}
              {metric(tr({ en: 'Workouts', ko: '운동 횟수' }), <>{s.workouts}{unit(tr({ en: '×', ko: '회' }))}</>)}
            </View>
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 12 }}>{tr({ en: 'By body part', ko: '부위별 빈도' })}</Text>
              {s.bodyParts.length === 0 ? (
                <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'No body-part records.', ko: '부위 기록이 없어요.' })}</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {s.bodyParts.map((b: any) => (
                    <View key={b.part} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <Text style={{ width: 40, fontSize: 11, color: c.text2 }}>{b.part}</Text>
                      <View style={{ flex: 1, height: 9, backgroundColor: c.surfaceAlt, borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${b.pct}%`, height: '100%', backgroundColor: col, borderRadius: 5 }} />
                      </View>
                      <Text style={{ width: 24, textAlign: 'right', fontSize: 11, fontWeight: '700', color: c.text }}>{b.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}

        {/* ── 대전 ── */}
        {!activity && category === 'match' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Matches', ko: '총 경기' }), <>{s.count}{unit(tr({ en: '×', ko: '회' }))}</>)}
              {metric(tr({ en: 'Win rate', ko: '승률' }), s.resultRecorded > 0 ? <>{s.winRate}{unit('%')}</> : '—')}
            </View>
            <View style={{ backgroundColor: soft, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 10 }}>{tr({ en: 'Record', ko: '전적' })}</Text>
              {s.resultRecorded > 0 ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { label: tr({ en: 'W', ko: '승' }), v: s.wins, color: c.success },
                    { label: tr({ en: 'D', ko: '무' }), v: s.draws, color: c.text2 },
                    { label: tr({ en: 'L', ko: '패' }), v: s.losses, color: c.error },
                  ].map((x) => (
                    <View key={x.label} style={{ flex: 1, alignItems: 'center', backgroundColor: c.surface, borderRadius: 10, paddingVertical: 10 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: x.color }}>{x.v}</Text>
                      <Text style={{ fontSize: 12, color: c.text2, marginTop: 2 }}>{x.label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 12.5, color: c.text3 }}>{tr({ en: 'No matches with a result (W/D/L) logged yet. Pick a result when logging to build your record.', ko: '결과(승/무/패)가 기록된 경기가 없어요. 기록 시 결과를 선택하면 전적이 쌓여요.' })}</Text>
              )}
            </View>
            {!activity && s.bySport.length > 0 ? (
              <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By sport', ko: '종목별' })}</Text>
                {s.bySport.map((b: any) => (
                  <Pressable key={b.activity} onPress={() => drill(b.activity)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ flex: 1, fontSize: 12.5, color: c.text2 }}>{activityLabel(b.activity)}</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text }}>{tr({ en: `${b.count}×`, ko: `${b.count}회` })}</Text>
                    <Icon.chevronRight size={13} color={c.text3} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {/* ── 자유 ── */}
        {!activity && category === 'outing' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Records', ko: '총 기록' }), <>{s.count}{unit(tr({ en: '×', ko: '회' }))}</>)}
              {metric(tr({ en: 'Nights', ko: '숙박' }), <>{s.totalNights}{unit(tr({ en: 'nights', ko: '박' }))}</>)}
              {metric(tr({ en: 'Regions', ko: '지역' }), <>{s.regionCount}{unit(tr({ en: 'regions', ko: '곳' }))}</>)}
            </View>
            {/* 지역별 */}
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By region', ko: '지역별' })}</Text>
              {s.byRegion.length === 0 ? (
                <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'No region recorded.', ko: '기록된 지역이 없어요.' })}</Text>
              ) : (
                s.byRegion.map((b: any) => (
                  <View key={b.region} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12.5, color: c.text2 }} numberOfLines={1}>{b.region}</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text }}>{tr({ en: `${b.count}×`, ko: `${b.count}회` })}</Text>
                  </View>
                ))
              )}
            </View>
            {/* 활동별 */}
            {!activity && s.byActivity.length > 0 ? (
              <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By activity', ko: '활동별' })}</Text>
                {s.byActivity.map((b: any) => (
                  <Pressable key={b.activity} onPress={() => drill(b.activity)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ flex: 1, fontSize: 12.5, color: c.text2 }}>{activityLabel(b.activity)}</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text }}>{tr({ en: `${b.count}×`, ko: `${b.count}회` })}</Text>
                    <Icon.chevronRight size={13} color={c.text3} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {!activity && category === 'free' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Records', ko: '총 기록' }), <>{s.count}{unit(tr({ en: '×', ko: '회' }))}</>)}
              {metric(tr({ en: 'Books read', ko: '읽은 책' }), <>{s.bookCount}{unit(tr({ en: 'books', ko: '권' }))}</>)}
            </View>
            {!activity && s.byActivity.length > 0 ? (
              <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'By activity', ko: '활동별' })}</Text>
                {s.byActivity.map((b: any) => (
                  <Pressable key={b.activity} onPress={() => drill(b.activity)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ flex: 1, fontSize: 12.5, color: c.text2 }}>{activityLabel(b.activity)}</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text }}>{tr({ en: `${b.count}×`, ko: `${b.count}회` })}</Text>
                    <Icon.chevronRight size={13} color={c.text3} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {/* ── 공연 ── */}
        {!activity && category === 'performance' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric(tr({ en: 'Watched', ko: '총 관람' }), <>{s.count}{unit(tr({ en: 'shows', ko: '편' }))}</>)}
              <View style={{ flex: 1, ...card }}>
                <Text style={{ fontSize: 11, color: c.text2 }}>{tr({ en: 'Avg rating', ko: '평균 평점' })}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>{s.avgRating ?? '—'}</Text>
                  {s.avgRating ? (
                    <Glyph size={14} color={c.star} fill={c.star} strokeWidth={0}>
                      <Path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" />
                    </Glyph>
                  ) : null}
                </View>
              </View>
            </View>

            {/* 장르별 관람 — 단일 장르로 좁힌 상태면 숨김 */}
            {!activity ? (
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 11 }}>{tr({ en: 'By genre', ko: '장르별 관람' })}</Text>
              {s.genres.length === 0 ? (
                <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'No records.', ko: '기록이 없어요.' })}</Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 11 }}>
                    {s.genres.map((g: any, i: number) => (
                      <View key={g.genre} style={{ width: `${g.pct}%`, backgroundColor: mix(col, c.surface, 100 - i * 35) }} />
                    ))}
                  </View>
                  <View style={{ gap: 7 }}>
                    {s.genres.map((g: any, i: number) => (
                      <Pressable key={g.genre} onPress={() => drill(g.genre)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: mix(col, c.surface, 100 - i * 35) }} />
                        <Text style={{ flex: 1, fontSize: 12, color: c.text2 }}>{activityLabel(g.genre)}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>{tr({ en: `${g.count}`, ko: `${g.count}편` })}</Text>
                        <Icon.chevronRight size={13} color={c.text3} strokeWidth={2} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
            ) : null}

            {/* 최다 기록 */}
            {s.topWork.value || s.topActor || s.topVenue.value ? (
              <View style={{ backgroundColor: soft, borderRadius: 14, padding: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: col, marginBottom: 9 }}>{tr({ en: 'Top records', ko: '최다 기록' })}</Text>
                <View style={{ gap: 8 }}>
                  {s.topWork.value ? (
                    <Row label={tr({ en: 'Most-watched work', ko: '최다 관람 작품' })} value={tr({ en: `${s.topWork.value} · ${s.topWork.n}×`, ko: `${s.topWork.value} · ${s.topWork.n}회` })} c={c} />
                  ) : null}
                  {s.topActor ? <Row label={tr({ en: 'Top actor', ko: '최다 배우' })} value={s.topActor} c={c} /> : null}
                  {s.topVenue.value ? <Row label={tr({ en: 'Favorite venue', ko: '최애 극장' })} value={s.topVenue.value} c={c} /> : null}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {/* 세부 종목 리스트 — 유산소·근력 부모에서만. 탭 → 단독 세부. */}
        {subtypes.length > 0 ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'Sub-types', ko: '세부 종목' })}</Text>
              <Text style={{ fontSize: 11, color: c.text3 }}>{tr({ en: 'Tap for details →', ko: '탭하면 세부 →' })}</Text>
            </View>
            {subtypes.map((st) => {
              const SubIcon = iconFor(st.activity);
              return (
                <Pressable key={st.activity} onPress={() => drill(st.activity)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
                    <SubIcon size={16} color={col} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{activityLabel(st.activity)}</Text>
                    <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{tr({ en: `${st.count}×`, ko: `${st.count}회` })}</Text>
                  </View>
                  <Icon.chevronRight size={17} color={c.text3} strokeWidth={2} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* 최신순 기록 — 단독 세부에서만. 100% 실데이터. */}
        {activity && recent.length > 0 ? (
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
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                    {r.fields?.작품 ?? r.fields?.지역 ?? r.fields?.장소 ?? activityLabel(r.activity)}
                  </Text>
                  {r.meta ? <Text numberOfLines={1} style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{r.meta}</Text> : null}
                </View>
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

function Row({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 12.5, color: c.text2 }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text }}>{value}</Text>
    </View>
  );
}

// 평균 페이스 추이(선). 낮을수록(빠를수록) 위로.
function PaceTrend({ paceLine, color, c }: { paceLine: { month: number; sec: number | null }[]; color: string; c: any }) {
  const pts = paceLine.map((p, i) => ({ ...p, i })).filter((p) => p.sec != null) as { month: number; sec: number; i: number }[];
  const first = pts[0]?.sec;
  const last = pts[pts.length - 1]?.sec;
  const delta = first != null && last != null ? first - last : 0; // +면 빨라짐
  const W = 260;
  const H = 66;
  const secs = pts.map((p) => p.sec);
  const min = Math.min(...secs);
  const max = Math.max(...secs);
  const span = Math.max(1, max - min);
  const x = (i: number) => 6 + (i / Math.max(1, paceLine.length - 1)) * (W - 12);
  const y = (sec: number) => 12 + ((sec - min) / span) * (H - 30); // 빠름(min)=위
  const points = pts.map((p) => `${x(p.i)},${y(p.sec)}`).join(' ');

  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{tr({ en: 'Pace trend', ko: '평균 페이스 추이' })}</Text>
        {pts.length >= 2 && delta !== 0 ? (
          <Text style={{ fontSize: 11, fontWeight: '600', color: delta > 0 ? c.success : c.error }}>
            {delta > 0 ? '↓' : '↑'} {Math.abs(delta)}″ {delta > 0 ? tr({ en: 'faster', ko: '빨라짐' }) : tr({ en: 'slower', ko: '느려짐' })}
          </Text>
        ) : null}
      </View>
      {pts.length >= 2 ? (
        <>
          <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={60} preserveAspectRatio="none">
            <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p) => (
              <SvgCircle key={p.i} cx={x(p.i)} cy={y(p.sec)} r={3} fill={color} />
            ))}
          </Svg>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
            {paceLine.map((p) => (
              <Text key={p.month} style={{ fontSize: 10, color: c.text3 }}>{tr({ en: `${p.month}M`, ko: `${p.month}월` })}</Text>
            ))}
          </View>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'Need more pace data.', ko: '페이스 데이터가 더 필요해요.' })}</Text>
      )}
    </View>
  );
}

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Polyline, Circle as SvgCircle } from 'react-native-svg';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { Segmented } from '../../components/controls';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { categoryStats, StatsPeriod, StatsCategory } from '../../store/selectors';

function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

const META: Record<StatsCategory, { label: string; sub: string }> = {
  cardio: { label: '유산소', sub: '러닝 · 사이클 · 수영' },
  strength: { label: '근력', sub: '웨이트 · 맨몸' },
  performance: { label: '공연', sub: '뮤지컬 · 연극 · 콘서트' },
};

export default function CategoryStatsScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { category } = useRoute().params as { category: StatsCategory };
  const { records, today } = useStore();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const s = categoryStats(records, category, period, today) as any;

  const col = category === 'cardio' ? c.cardio : category === 'strength' ? c.strength : c.perf;
  const soft = category === 'cardio' ? c.cardioSoft : category === 'strength' ? c.strengthSoft : c.perfSoft;
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
          <Text style={{ fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: c.text }}>{meta.label}</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>{meta.sub}</Text>
        </View>
        <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: col }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 11 }}>
        <Segmented<StatsPeriod>
          options={[
            { key: 'month', label: '월간' },
            { key: 'quarter', label: '분기' },
            { key: 'year', label: '연간' },
          ]}
          value={period}
          onChange={setPeriod}
          color={col}
        />

        {s.count === 0 ? (
          <Text style={{ fontSize: 12.5, color: c.text3, paddingVertical: 12, textAlign: 'center' }}>이 기간에 기록이 없어요.</Text>
        ) : null}

        {/* ── 유산소 ── */}
        {category === 'cardio' ? (
          <>
            {/* 월별 거리 */}
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>월별 달린 거리</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: col }}>총 {s.totalKm}km</Text>
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
              {metric('평균 페이스', <>{s.avgPace ?? '—'}{s.avgPace ? unit('/km') : null}</>)}
              {metric('평균 심박', s.avgHr != null ? <>{s.avgHr}{unit('bpm')}</> : '—')}
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric('최장 거리', <>{s.maxKm}{unit('km')}</>)}
              {metric('총 운동 시간', <>{s.totalHours}{unit('시간')}</>)}
            </View>
          </>
        ) : null}

        {/* ── 근력 ── */}
        {category === 'strength' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric('총 볼륨', <>{s.totalT}{unit('t')}</>)}
              {metric('운동 횟수', <>{s.workouts}{unit('회')}</>)}
            </View>
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 12 }}>부위별 빈도</Text>
              {s.bodyParts.length === 0 ? (
                <Text style={{ fontSize: 12, color: c.text3 }}>부위 기록이 없어요.</Text>
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

        {/* ── 공연 ── */}
        {category === 'performance' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {metric('총 관람', <>{s.count}{unit('편')}</>)}
              <View style={{ flex: 1, ...card }}>
                <Text style={{ fontSize: 11, color: c.text2 }}>평균 평점</Text>
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

            {/* 장르별 관람 */}
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 11 }}>장르별 관람</Text>
              {s.genres.length === 0 ? (
                <Text style={{ fontSize: 12, color: c.text3 }}>기록이 없어요.</Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 11 }}>
                    {s.genres.map((g: any, i: number) => (
                      <View key={g.genre} style={{ width: `${g.pct}%`, backgroundColor: mix(col, c.surface, 100 - i * 35) }} />
                    ))}
                  </View>
                  <View style={{ gap: 7 }}>
                    {s.genres.map((g: any, i: number) => (
                      <View key={g.genre} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: mix(col, c.surface, 100 - i * 35) }} />
                        <Text style={{ flex: 1, fontSize: 12, color: c.text2 }}>{g.genre}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>{g.count}편</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* 최다 기록 */}
            {s.topWork.value || s.topActor || s.topVenue.value ? (
              <View style={{ backgroundColor: soft, borderRadius: 14, padding: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: col, marginBottom: 9 }}>최다 기록</Text>
                <View style={{ gap: 8 }}>
                  {s.topWork.value ? (
                    <Row label="최다 관람 작품" value={`${s.topWork.value} · ${s.topWork.n}회`} c={c} />
                  ) : null}
                  {s.topActor ? <Row label="최다 배우" value={s.topActor} c={c} /> : null}
                  {s.topVenue.value ? <Row label="최애 극장" value={s.topVenue.value} c={c} /> : null}
                </View>
              </View>
            ) : null}
          </>
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
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>평균 페이스 추이</Text>
        {pts.length >= 2 && delta !== 0 ? (
          <Text style={{ fontSize: 11, fontWeight: '600', color: delta > 0 ? c.success : c.error }}>
            {delta > 0 ? '↓' : '↑'} {Math.abs(delta)}″ {delta > 0 ? '빨라짐' : '느려짐'}
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
              <Text key={p.month} style={{ fontSize: 10, color: c.text3 }}>{p.month}월</Text>
            ))}
          </View>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: c.text3 }}>페이스 데이터가 더 필요해요.</Text>
      )}
    </View>
  );
}

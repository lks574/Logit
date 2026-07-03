import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { Glyph, Path } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { StatsFilter, statsSummary } from '../../store/selectors';

// mix two #RRGGBB colors: `pct`% of a into b (color-mix in srgb).
function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

// 4.6 통계 / 회고 — 이제 스토어 기록에서 실시간 집계 (Logit.dc.html 1015–1084).
export default function StatsScreen() {
  const { c } = useTheme();
  const { records, today } = useStore();
  const [filter, setFilter] = useState<StatsFilter>('all');
  const s = statsSummary(records, filter, today);

  const filters: { key: StatsFilter; label: string; color: string; soft: string }[] = [
    { key: 'all', label: '전체', color: c.accent, soft: c.accentSoft },
    { key: 'endurance', label: '유산소', color: c.cardio, soft: c.cardioSoft },
    { key: 'setrep', label: '근력', color: c.strength, soft: c.strengthSoft },
    { key: 'match', label: '대전', color: c.team, soft: c.teamSoft },
    { key: 'spectate', label: '공연', color: c.perf, soft: c.perfSoft },
    { key: 'free', label: '자유', color: c.accent, soft: c.accentSoft },
  ];

  const card = {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  } as const;

  const showDistance = s.hasDistance && (filter === 'all' || filter === 'endurance');
  const showSpectate = s.spectateCount > 0 && (filter === 'all' || filter === 'spectate');

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title + filter chips */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>회고</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {filters.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  backgroundColor: active ? f.color : f.soft,
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 13,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : f.color }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 13 }}>
        {/* Streak + yearly total */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15 }}>🔥</Text>
              <Text style={{ fontSize: 12, color: c.text2 }}>연속 기록</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>{s.streak}</Text>
              <Text style={{ fontSize: 13, color: c.text2 }}>일</Text>
            </View>
          </View>
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Glyph size={15} color={c.text2} strokeWidth={2}>
                <Path d="M4 19 L9 12 L13 15 L20 5" />
              </Glyph>
              <Text style={{ fontSize: 12, color: c.text2 }}>올해 누적</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>{s.count}</Text>
              <Text style={{ fontSize: 13, color: c.text2 }}>기록</Text>
            </View>
          </View>
        </View>

        {/* Monthly distance bar chart */}
        {showDistance ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>월별 달린 거리</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.cardio }}>총 {s.totalKm}km</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, height: 96 }}>
              {s.monthly.map((b) => {
                const intensity = Math.max(0, Math.min(1, (b.height - 4) / 80));
                const color = b.active ? c.cardio : b.km > 0 ? mix(c.cardio, c.cardioSoft, Math.round(intensity * 60)) : c.cardioSoft;
                return (
                  <View key={b.month} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View style={{ width: '100%', height: b.height, backgroundColor: color, borderRadius: 6 }} />
                    <Text style={{ fontSize: 10, color: b.active ? c.text : c.text3, fontWeight: b.active ? '600' : '400' }}>
                      {b.month}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Avg pace + longest distance */}
        {showDistance ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={card}>
              <Text style={{ fontSize: 12, color: c.text2 }}>평균 페이스</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 4 }}>
                {s.avgPace ?? '—'}
                <Text style={{ fontSize: 11, color: c.text2, fontWeight: '500' }}>/km</Text>
              </Text>
              {s.paceDeltaSec != null && s.paceDeltaSec !== 0 ? (
                <Text style={{ fontSize: 11, color: s.paceDeltaSec > 0 ? c.success : c.error, marginTop: 3 }}>
                  {s.paceDeltaSec > 0 ? '↓' : '↑'} {Math.abs(s.paceDeltaSec)}″ {s.paceDeltaSec > 0 ? '빨라짐' : '느려짐'}
                </Text>
              ) : null}
            </View>
            <View style={card}>
              <Text style={{ fontSize: 12, color: c.text2 }}>최장 거리</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 4 }}>
                {s.maxKm}
                <Text style={{ fontSize: 11, color: c.text2, fontWeight: '500' }}>km</Text>
              </Text>
              {s.maxDateLabel ? <Text style={{ fontSize: 11, color: c.text3, marginTop: 3 }}>{s.maxDateLabel}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* 공연 회고 summary */}
        {showSpectate ? (
          <View style={{ backgroundColor: c.perfSoft, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: c.perf, alignItems: 'center', justifyContent: 'center' }}>
                <Glyph size={13} color="#fff" strokeWidth={2.2}>
                  <Path d="M5 4h14v6a7 7 0 0 1-14 0z" />
                </Glyph>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>올해 관람 {s.spectateCount}편</Text>
            </View>
            {s.topWork ? (
              <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19.5 }}>
                최다 관람 <Text style={{ color: c.text, fontWeight: '600' }}>{s.topWork} {s.topWorkCount}편</Text>
                {s.topActor ? (
                  <>
                    {' · 최다 배우 '}
                    <Text style={{ color: c.text, fontWeight: '600' }}>{s.topActor}</Text>
                  </>
                ) : null}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* 필터에 데이터가 없을 때 */}
        {!showDistance && !showSpectate && s.count === 0 ? (
          <Text style={{ fontSize: 12, color: c.text3, paddingVertical: 8 }}>이 분류의 기록이 아직 없어요.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

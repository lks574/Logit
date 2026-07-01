import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../components/primitives';
import { Glyph, Path } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';

// mix two #RRGGBB colors: `pct`% of a into b (color-mix in srgb).
function mix(a: string, b: string, pct: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace('#', '').slice(i - 1, i + 1), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const w = pct / 100;
  const ch = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

// 4.6 통계 / 회고 — 데이터 쌓인 상태 (Logit.dc.html lines 1015–1084)
export default function StatsScreen() {
  const { c } = useTheme();

  const filters = [
    { label: '전체', fg: '#fff', bg: c.accent },
    { label: '유산소', fg: c.cardio, bg: c.cardioSoft },
    { label: '근력', fg: c.strength, bg: c.strengthSoft },
    { label: '공연', fg: c.perf, bg: c.perfSoft },
  ];

  // Monthly running distance bars (px heights from HTML) + colors.
  const bars = [
    { h: 38, month: '2', color: c.cardioSoft, active: false },
    { h: 52, month: '3', color: c.cardioSoft, active: false },
    { h: 46, month: '4', color: c.cardioSoft, active: false },
    { h: 70, month: '5', color: mix(c.cardio, c.cardioSoft, 55), active: false },
    { h: 84, month: '6', color: c.cardio, active: true },
  ];

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title + filter chips */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>회고</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {filters.map((f) => (
            <View
              key={f.label}
              style={{ backgroundColor: f.bg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 13 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: f.fg }}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 18, gap: 13 }}>
        {/* Streak + yearly total */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15 }}>🔥</Text>
              <Text style={{ fontSize: 12, color: c.text2 }}>연속 기록</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>12</Text>
              <Text style={{ fontSize: 13, color: c.text2 }}>일</Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Glyph size={15} color={c.text2} strokeWidth={2}>
                <Path d="M4 19 L9 12 L13 15 L20 5" />
              </Glyph>
              <Text style={{ fontSize: 12, color: c.text2 }}>올해 누적</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>148</Text>
              <Text style={{ fontSize: 13, color: c.text2 }}>기록</Text>
            </View>
          </View>
        </View>

        {/* Monthly distance bar chart */}
        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>월별 달린 거리</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.cardio }}>총 184km</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, height: 96 }}>
            {bars.map((b) => (
              <View key={b.month} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ width: '100%', height: b.h, backgroundColor: b.color, borderRadius: 6 }} />
                <Text
                  style={{
                    fontSize: 10,
                    color: b.active ? c.text : c.text3,
                    fontWeight: b.active ? '600' : '400',
                  }}
                >
                  {b.month}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Avg pace + longest distance */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ fontSize: 12, color: c.text2 }}>평균 페이스</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 4 }}>
              5′22″
              <Text style={{ fontSize: 11, color: c.text2, fontWeight: '500' }}>/km</Text>
            </Text>
            <Text style={{ fontSize: 11, color: c.success, marginTop: 3 }}>↓ 8″ 빨라짐</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ fontSize: 12, color: c.text2 }}>최장 거리</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 4 }}>
              12.4
              <Text style={{ fontSize: 11, color: c.text2, fontWeight: '500' }}>km</Text>
            </Text>
            <Text style={{ fontSize: 11, color: c.text3, marginTop: 3 }}>6월 18일</Text>
          </View>
        </View>

        {/* 공연 회고 summary */}
        <View style={{ backgroundColor: c.perfSoft, borderRadius: 14, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: c.perf,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph size={13} color="#fff" strokeWidth={2.2}>
                <Path d="M5 4h14v6a7 7 0 0 1-14 0z" />
              </Glyph>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>올해 관람 24편</Text>
          </View>
          <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19.5 }}>
            최다 관람 <Text style={{ color: c.text, fontWeight: '600' }}>레미제라블 3회</Text> · 최다 배우{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>민우혁</Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}

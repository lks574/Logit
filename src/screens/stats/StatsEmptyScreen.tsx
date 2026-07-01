import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path } from '../../components/Glyph';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';

// 4.7 통계 — 빈 상태 (데이터 부족) (Logit.dc.html lines 1087–1128)
export default function StatsEmptyScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();

  // "기록이 쌓이면 보일 내용" rows.
  const rows = [
    {
      color: c.cardio,
      soft: c.cardioSoft,
      title: '월별 거리·페이스 추이',
      req: '유산소 3회 이상',
      progress: '2/3',
      icon: <Path d="M3 18l5-9 4 5 3-4 6 8" />,
    },
    {
      color: c.strength,
      soft: c.strengthSoft,
      title: '부위별 빈도 · 중량 추이',
      req: '근력 5회 이상',
      progress: '1/5',
      icon: <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" />,
    },
    {
      color: c.perf,
      soft: c.perfSoft,
      title: '관람 수 · 최다 작품/배우',
      req: '공연 2회 이상',
      progress: '1/2',
      icon: <Path d="M5 4h14v6a7 7 0 0 1-14 0z" />,
    },
  ];

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Title */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
        <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text }}>회고</Text>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        {/* Empty guidance */}
        <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 22, paddingHorizontal: 10, gap: 13 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph size={40} color={c.accent} strokeWidth={1.6}>
              <Path d="M4 20V11M10 20V7M16 20v-5M22 20H2" />
            </Glyph>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>아직 통계가 적어요</Text>
            <Text style={{ fontSize: 13, color: c.text2, lineHeight: 20, marginTop: 6, textAlign: 'center' }}>
              기록이 쌓이면 추이와 회고가{'\n'}여기에 자동으로 나타납니다.
            </Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>기록이 쌓이면 보일 내용</Text>

        {/* Partial-content rows */}
        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {rows.map((r, i) => (
            <View key={r.title}>
              {i > 0 ? <View style={{ height: 1, backgroundColor: c.border }} /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: r.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Glyph size={17} color={r.color} strokeWidth={2}>
                    {r.icon}
                  </Glyph>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{r.title}</Text>
                  <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{r.req}</Text>
                </View>
                <Text style={{ fontSize: 11, color: c.text3 }}>{r.progress}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Button
          label="기록 추가하기"
          fullWidth
          onPress={() => nav.navigate('ActivitySelect')}
          icon={
            <Glyph size={17} color="#fff" strokeWidth={2.4}>
              <Path d="M12 5v14M5 12h14" />
            </Glyph>
          }
          style={{ paddingVertical: 14, borderRadius: 13 }}
        />
      </View>
    </Screen>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { Glyph, Icon, Path } from '../components/Glyph';
import { ActivityCard, StatCard } from '../components/cards';
import { SyncStatusBadge } from '../components/badges';
import { useTheme } from '../theme/ThemeContext';
import { radius, withAlpha } from '../theme/tokens';
import { colorsFor } from '../data/activities';

export default function HomeScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const cardio = colorsFor('endurance', c);
  const perf = colorsFor('spectate', c);

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Date + title + sync badge */}
      <View
        style={{
          paddingTop: 8,
          paddingHorizontal: 18,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 13, color: c.text2, fontWeight: '500' }}>6월 30일 월요일</Text>
          <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text, marginTop: 2 }}>
            기록
          </Text>
        </View>
        <View style={{ marginTop: 6 }}>
          <SyncStatusBadge state="synced" />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        {/* 다가오는 약속 header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -4 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>다가오는 약속</Text>
          <Pressable
            onPress={() => nav.navigate('Plans')}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>캘린더</Text>
            <Icon.chevronRight size={14} color={c.accent} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Hero plan card */}
        <Pressable
          onPress={() => nav.navigate('Plans')}
          style={{
            backgroundColor: c.accentSoft,
            borderWidth: 1,
            borderColor: withAlpha(c.accent, 20),
            borderRadius: 16,
            padding: 5,
          }}
        >
          {/* 헬스 row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9 }}>
            <View style={planIconWrap(c)}>
              <Glyph size={18} color={c.strength} strokeWidth={2}>
                <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" />
              </Glyph>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>헬스</Text>
                {/* empty-ring "약속 미완료" dot */}
                <View
                  accessibilityLabel="약속 미완료"
                  style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: c.accent }}
                />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>
                오늘 오후 8:00 · 홈짐
              </Text>
            </View>
            <View style={{ backgroundColor: c.accent, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>D-DAY</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: withAlpha(c.accent, 15), marginHorizontal: 9 }} />

          {/* 축구 row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9 }}>
            <View style={planIconWrap(c)}>
              <Glyph size={18} color={c.team} strokeWidth={2}>
                <Path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
                <Path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z" />
              </Glyph>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>축구</Text>
              <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>
                7/2 (수) 오후 3:00 · 잠실 보조경기장
              </Text>
            </View>
            <View
              style={{
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: withAlpha(c.accent, 25),
                borderRadius: 6,
                paddingVertical: 3,
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: c.accent }}>D-2</Text>
            </View>
          </View>
        </Pressable>

        {/* 이번 주 header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>이번 주</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>6/24 – 6/30</Text>
        </View>

        <StatCard
          cells={[
            { value: '5', label: '기록' },
            { value: '18.4', unit: 'km', label: '달린 거리', valueColor: c.cardio },
            { value: '🔥3', label: '연속 일' },
          ]}
        />

        {/* 최근 기록 */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24, marginTop: 2 }}>
          최근 기록
        </Text>

        <ActivityCard
          color={cardio.color}
          soft={cardio.soft}
          icon={<Icon.running size={19} color={cardio.color} />}
          title="런닝"
          time="오후 6:30"
          meta="한강공원 · 5.2km · 27′12″"
          ratingFilled={4}
          memo="노을이 좋았다"
          onPress={() => nav.navigate('Detail', { activity: '런닝' })}
        />
        <ActivityCard
          color={perf.color}
          soft={perf.soft}
          icon={<Icon.performance size={19} color={perf.color} />}
          title="뮤지컬"
          time="어제"
          meta="〈레미제라블〉 · 블루스퀘어"
          ratingFilled={5}
          memo="3차 관람"
          onPress={() => nav.navigate('Detail', { activity: '뮤지컬' })}
        />
      </View>
    </Screen>
  );
}

function planIconWrap(c: ReturnType<typeof useTheme>['c']) {
  return {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: withAlpha(c.accent, 22),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { IconButton } from '../components/Button';
import { Icon, Glyph, Path, Circle } from '../components/Glyph';
import { DdayBadge } from '../components/badges';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/tokens';

type Seg = 'past' | 'upcoming';

// Plan row content copied 1:1 from Logit.dc.html §5.2 (lines 1360–1401).
type Plan = {
  title: string;
  extra?: string; // "· 3명 함께" / "〈아이유〉" / "· 10km 목표"
  meta: string;
  dday: number; // 0 = D-DAY
  icon: React.ReactNode;
  iconColor: string;
  iconSoft: string;
  activity: string;
};

export default function PlansScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const [seg, setSeg] = React.useState<Seg>('upcoming');

  const iconSize = 19;

  const today: Plan[] = [
    {
      title: '헬스',
      meta: '오후 8:00 · 홈짐',
      dday: 0,
      activity: '헬스',
      iconColor: c.strength,
      iconSoft: c.strengthSoft,
      icon: (
        <Glyph size={iconSize} color={c.strength}>
          <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" />
        </Glyph>
      ),
    },
  ];

  const thisWeek: Plan[] = [
    {
      title: '축구',
      extra: '· 3명 함께',
      meta: '7/2 (수) 오후 3:00 · 잠실 보조경기장',
      dday: 2,
      activity: '축구',
      iconColor: c.team,
      iconSoft: c.teamSoft,
      icon: (
        <Glyph size={iconSize} color={c.team}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z" />
          <Path d="M12 3v4.5M4 9l4 1.5M20 9l-4 1.5M7 19l2.5-4M17 19l-2.5-4" />
        </Glyph>
      ),
    },
    {
      title: '콘서트',
      extra: '〈아이유〉',
      meta: '7/3 (목) 오후 7:30 · 올림픽홀',
      dday: 3,
      activity: '콘서트',
      iconColor: c.perf,
      iconSoft: c.perfSoft,
      icon: (
        <Glyph size={iconSize} color={c.perf}>
          <Path d="M9 2h6v12a3 3 0 0 1-6 0z" />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
        </Glyph>
      ),
    },
    {
      title: '런닝',
      extra: '· 10km 목표',
      meta: '7/5 (토) 오전 7:00 · 한강공원',
      dday: 5,
      activity: '런닝',
      iconColor: c.cardio,
      iconSoft: c.cardioSoft,
      icon: (
        <Glyph size={iconSize} color={c.cardio}>
          <Circle cx="16" cy="4.5" r="2" />
          <Path d="M10 9l3-1.5 3 2 2 1.5M13 7.5l-1 5 3 2.5 1 4M12 12.5l-3.5 1.5L6 19" />
        </Glyph>
      ),
    },
  ];

  const PlanRow = ({ p }: { p: Plan }) => (
    <Pressable
      onPress={() => nav.navigate('Detail', { activity: p.activity })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        paddingVertical: 11,
        paddingHorizontal: 13,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: p.iconSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {p.icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{p.title}</Text>
          {p.extra ? <Text style={{ fontSize: 10, color: c.text3 }}>{p.extra}</Text> : null}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>
          {p.meta}
        </Text>
      </View>
      {p.dday === 0 ? (
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <DdayBadge days={0} />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: c.accent,
            }}
          />
        </View>
      ) : (
        <DdayBadge days={p.dday} color={p.iconColor} />
      )}
    </Pressable>
  );

  const GroupHeader = ({ label, date, color }: { label: string; date?: string; color: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label}</Text>
      {date ? <Text style={{ fontSize: 11, color: c.text3 }}>{date}</Text> : null}
    </View>
  );

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header: back affordance + title + 지난/예정 toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 6,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <IconButton size={30} onPress={() => nav.goBack()}>
            <Icon.chevronLeft size={18} color={c.text2} strokeWidth={2.4} />
          </IconButton>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>
              다가오는 약속
            </Text>
            <Text style={{ fontSize: 12.5, color: c.text2, marginTop: 2 }}>앞으로 예정된 4건</Text>
          </View>
        </View>
        {/* 지난 / 예정 Segmented toggle (pill track) */}
        <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 999, padding: 3 }}>
          {(['past', 'upcoming'] as Seg[]).map((k) => {
            const active = seg === k;
            const label = k === 'past' ? '지난' : '예정';
            return (
              <Pressable
                key={k}
                onPress={() => setSeg(k)}
                hitSlop={4}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 11,
                  borderRadius: 999,
                  backgroundColor: active ? c.accent : 'transparent',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : c.text2 }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Date-grouped plan lists */}
      <View style={{ paddingHorizontal: 18, paddingTop: 6, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <GroupHeader label="오늘" date="6월 30일 (월)" color={c.accent} />
          {today.map((p, i) => (
            <PlanRow key={i} p={p} />
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <GroupHeader label="이번 주" color={c.text2} />
          {thisWeek.map((p, i) => (
            <PlanRow key={i} p={p} />
          ))}
        </View>

        {/* ＋약속 추가 */}
        <Pressable
          onPress={() => nav.navigate('AddPlan')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            backgroundColor: c.surface,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: withAlpha(c.accent, 40),
            borderRadius: 14,
            paddingVertical: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon.plus size={16} color={c.accent} strokeWidth={2.4} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>약속 추가</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

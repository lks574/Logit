import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { ActivityCard, StatCard } from '../../components/cards';
import { SyncStatusBadge } from '../../components/badges';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { activities, colorsFor } from '../../data/activities';
import { useStore, useSyncState } from '../../store/StoreContext';
import { dday, upcomingPlans, weekStats } from '../../store/selectors';
import { StoredPlan } from '../../store/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// "7/2 (수)" — month/day + weekday, matching the design.
function monthDayLabel(dateISO: string): string {
  const d = new Date(Date.parse(dateISO + 'T00:00:00Z'));
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAYS[d.getUTCDay()]})`;
}

// "6월 30일 월요일" — 헤더용, today에서 파생.
function headerDate(dateISO: string): string {
  const d = new Date(Date.parse(dateISO + 'T00:00:00Z'));
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${WEEKDAYS[d.getUTCDay()]}요일`;
}

// "6/24 – 6/30" — 최근 7일 범위, today에서 파생.
function weekRangeLabel(dateISO: string): string {
  const base = Date.parse(dateISO + 'T00:00:00Z');
  const f = (t: number) => {
    const d = new Date(t);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  return `${f(base - 6 * 86400000)} – ${f(base)}`;
}

export default function HomeScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { today, records, plans } = useStore();
  const sync = useSyncState();

  const upcoming = upcomingPlans(plans, today).slice(0, 2);
  const week = weekStats(records, today);

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
          <Text style={{ fontSize: 13, color: c.text2, fontWeight: '500' }}>{headerDate(today)}</Text>
          <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text, marginTop: 2 }}>
            기록
          </Text>
        </View>
        <View style={{ marginTop: 6 }}>
          <SyncStatusBadge state={sync} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        {/* 다가오는 약속 — 예정된 약속이 있을 때만 표시(빈 슬리버 방지) */}
        {upcoming.length > 0 ? (
          <>
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
              {upcoming.map((p, i) => (
                <PlanRow key={p.id} plan={p} today={today} c={c} first={i === 0} showDivider={i > 0} />
              ))}
            </Pressable>
          </>
        ) : null}

        {/* 이번 주 header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>이번 주</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>{weekRangeLabel(today)}</Text>
        </View>

        <StatCard
          cells={[
            { value: String(week.count), label: '기록' },
            { value: String(week.km), unit: 'km', label: '이동 거리', valueColor: c.cardio },
            { value: `🔥${week.streak}`, label: '연속 일' },
          ]}
        />

        {/* 최근 기록 */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24, marginTop: 2 }}>
          최근 기록
        </Text>

        {records.slice(0, 6).map((r) => {
          const rc = colorsFor(r.template, c);
          const iconName = activities[r.activity]?.icon;
          const IconComp = iconName ? Icon[iconName] : Icon.yoga;
          return (
            <ActivityCard
              key={r.id}
              color={rc.color}
              soft={rc.soft}
              icon={<IconComp size={19} color={rc.color} />}
              title={r.activity}
              time={r.timeLabel}
              meta={r.meta}
              ratingFilled={r.rating}
              memo={r.memo}
              onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })}
            />
          );
        })}
      </View>
    </Screen>
  );
}

function PlanRow({
  plan,
  today,
  c,
  first,
  showDivider,
}: {
  plan: StoredPlan;
  today: string;
  c: ReturnType<typeof useTheme>['c'];
  first: boolean;
  showDivider: boolean;
}) {
  const act = activities[plan.activity];
  const colors = colorsFor(act?.template ?? plan.template, c);
  const IconComp = act ? Icon[act.icon] : Icon.yoga;
  const d = dday(plan.dateISO, today);
  const dateLabel = d === 0 ? '오늘' : monthDayLabel(plan.dateISO);
  const meta = `${dateLabel} ${plan.timeLabel} · ${plan.place ?? ''}`.trim();

  return (
    <>
      {showDivider && <View style={{ height: 1, backgroundColor: withAlpha(c.accent, 15), marginHorizontal: 9 }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9 }}>
        <View style={planIconWrap(c)}>
          <IconComp size={18} color={colors.color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{plan.activity}</Text>
            {/* empty-ring "약속 미완료" dot on the first/today row */}
            {first && (
              <View
                accessibilityLabel="약속 미완료"
                style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: c.accent }}
              />
            )}
          </View>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>
            {meta}
          </Text>
        </View>
        {d === 0 ? (
          <View style={{ backgroundColor: c.accent, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>D-DAY</Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: withAlpha(c.team, 25),
              borderRadius: 6,
              paddingVertical: 3,
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.team }}>D-{d}</Text>
          </View>
        )}
      </View>
    </>
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

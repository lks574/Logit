import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { ActivityCard } from '../../components/cards';
import { SyncStatusBadge } from '../../components/badges';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { activities, activityLabel, colorsFor } from '../../data/activities';
import { tr } from '../../i18n/i18n';
import { longDate, slashDayWeekday, displayTimeLabel } from '../../lib/date';
import { useStore, useSyncState } from '../../store/StoreContext';
import { dday, recordsOn, upcomingPlans, weekStats } from '../../store/selectors';
import { StoredPlan } from '../../store/types';
import { TemplateType } from '../../theme/tokens';

// "6/24 – 6/30" — 최근 7일 범위, today에서 파생. (숫자만 — 언어 무관)
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
  const todayRecords = recordsOn(records, today);

  // 빠른 기록: 가장 자주 기록한 활동 상위 4개 → 활동선택을 건너뛰고 폼 직행.
  const topActivities = useMemo(() => {
    const counts = new Map<string, { count: number; template: TemplateType }>();
    for (const r of records) {
      const e = counts.get(r.activity) ?? { count: 0, template: r.template };
      e.count += 1;
      counts.set(r.activity, e);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([activity, v]) => ({ activity, template: v.template }));
  }, [records]);

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
          <Text style={{ fontSize: 13, color: c.text2, fontWeight: '500' }}>{longDate(today)}</Text>
          <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text, marginTop: 2 }}>
            {tr({ en: 'Log', ko: '기록' })}
          </Text>
        </View>
        <View style={{ marginTop: 6 }}>
          <SyncStatusBadge state={sync} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        {/* 오늘 — 홈의 앵커. 첫 기록 전(records 0)엔 아래 빈-상태 CTA가 대신하므로 생략. */}
        {records.length > 0 ? (
          <View
            style={{
              backgroundColor: todayRecords.length > 0 ? c.accentSoft : c.surface,
              borderWidth: 1,
              borderColor: todayRecords.length > 0 ? withAlpha(c.accent, 20) : c.border,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: todayRecords.length > 0 ? c.accent : c.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {todayRecords.length > 0 ? (
                <Icon.check size={18} color="#fff" strokeWidth={2.4} />
              ) : (
                <Text style={{ fontSize: 16 }}>🔥</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>
                {todayRecords.length > 0
                  ? tr({ en: `${todayRecords.length} logged today`, ko: `오늘 ${todayRecords.length}개 기록했어요` })
                  : tr({ en: 'Nothing logged today', ko: '오늘 기록이 없어요' })}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>
                {todayRecords.length > 0
                  ? [...new Set(todayRecords.map((r) => activityLabel(r.activity)))].join(' · ')
                  : week.streak > 0
                    ? tr({ en: `${week.streak}-day streak — keep it going`, ko: `🔥${week.streak}일 연속 — 오늘도 이어가요` })
                    : tr({ en: 'Log one to start a streak', ko: '가볍게 하나 남겨보세요' })}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 빠른 기록 — 자주 하는 활동은 활동선택을 건너뛰고 폼 직행 */}
        {topActivities.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            style={{ marginHorizontal: -2 }}
          >
            {topActivities.map((a) => {
              const qc = colorsFor(a.template, c);
              const iconName = activities[a.activity]?.icon;
              const IconComp = iconName ? Icon[iconName] : Icon.yoga;
              return (
                <Pressable
                  key={a.activity}
                  onPress={() => nav.navigate('RecordForm', { activity: a.activity, template: a.template })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 20,
                    paddingVertical: 7,
                    paddingLeft: 8,
                    paddingRight: 13,
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: qc.soft, alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={13} color={qc.color} />
                  </View>
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: c.text }}>{activityLabel(a.activity)}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => nav.navigate('ActivitySelect')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: c.accentSoft,
                borderRadius: 20,
                paddingVertical: 7,
                paddingHorizontal: 13,
              }}
            >
              <Icon.plus size={14} color={c.accent} strokeWidth={2.4} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: c.accent }}>{tr({ en: 'More', ko: '더보기' })}</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {/* 다가오는 약속 — 예정된 약속이 있을 때만 표시(빈 슬리버 방지) */}
        {upcoming.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>{tr({ en: 'Upcoming', ko: '다가오는 약속' })}</Text>
              <Pressable
                onPress={() => nav.navigate('Plans')}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'Calendar', ko: '캘린더' })}</Text>
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
                <PlanRow
                  key={p.id}
                  plan={p}
                  today={today}
                  c={c}
                  first={i === 0}
                  showDivider={i > 0}
                  onConvert={() => nav.navigate('RecordForm', { activity: p.activity, template: p.template, planId: p.id })}
                />
              ))}
            </Pressable>
          </>
        ) : null}

        {/* 이번 주 header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>{tr({ en: 'This week', ko: '이번 주' })}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={{ fontSize: 11, color: c.text3 }}>{weekRangeLabel(today)}</Text>
            <Icon.chevronRight size={13} color={c.text3} strokeWidth={2.2} />
          </View>
        </View>

        <Pressable
          onPress={() => nav.navigate('Stats')}
          style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}
        >
          {/* 기록 수 · 종목 수 / 연속 */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>
              {week.count}
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}> {tr({ en: 'records', ko: '기록' })} · {tr({ en: `${week.composition.length} sports`, ko: `${week.composition.length}종목` })}</Text>
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>
              🔥{week.streak}
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}> {tr({ en: 'streak', ko: '연속' })}</Text>
            </Text>
          </View>

          {week.composition.length ? (
            <>
              {/* 활동 구성 바 */}
              <View style={{ flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
                {week.composition.map((a) => (
                  <View key={a.activity} style={{ flex: a.count, backgroundColor: colorsFor(a.template, c).color }} />
                ))}
              </View>
              {/* 범례 */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }}>
                {week.composition.map((a) => (
                  <View key={a.activity} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colorsFor(a.template, c).color }} />
                    <Text style={{ fontSize: 12, color: c.text2 }}>{activityLabel(a.activity)} {a.count}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'No records this week yet.', ko: '이번 주 기록이 아직 없어요.' })}</Text>
          )}
        </Pressable>

        {/* 최근 기록 — 기록이 있을 때만. 없으면 시작 유도 CTA로 대체. */}
        {records.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, letterSpacing: 0.24 }}>
                {tr({ en: 'Recent', ko: '최근 기록' })}
              </Text>
              {records.length > 4 ? (
                <Pressable
                  onPress={() => nav.navigate('Calendar')}
                  hitSlop={8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'See all', ko: '전체 보기' })}</Text>
                  <Icon.chevronRight size={14} color={c.accent} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>

            {records.slice(0, 4).map((r) => {
              const rc = colorsFor(r.template, c);
              const iconName = activities[r.activity]?.icon;
              const IconComp = iconName ? Icon[iconName] : Icon.yoga;
              return (
                <ActivityCard
                  key={r.id}
                  color={rc.color}
                  soft={rc.soft}
                  icon={<IconComp size={19} color={rc.color} />}
                  title={activityLabel(r.activity)}
                  time={displayTimeLabel(r.timeLabel)}
                  meta={r.meta}
                  ratingFilled={r.rating}
                  memo={r.memo}
                  onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })}
                />
              );
            })}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 36, gap: 14 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: c.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph size={28} color={c.accent} strokeWidth={2.2}>
                <Path d="M12 5v14M5 12h14" />
              </Glyph>
            </View>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{tr({ en: 'Add your first record', ko: '첫 기록을 남겨보세요' })}</Text>
              <Text style={{ fontSize: 12.5, color: c.text2, textAlign: 'center', lineHeight: 18 }}>
                {tr({ en: 'Log a workout or a show and it\nbuilds up here and in your stats.', ko: '운동이나 공연을 기록하면\n여기와 통계에 차곡차곡 모여요.' })}
              </Text>
            </View>
            <Pressable
              onPress={() => nav.navigate('ActivitySelect')}
              style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 2 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{tr({ en: 'Add record', ko: '기록 추가하기' })}</Text>
            </Pressable>
          </View>
        )}
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
  onConvert,
}: {
  plan: StoredPlan;
  today: string;
  c: ReturnType<typeof useTheme>['c'];
  first: boolean;
  showDivider: boolean;
  onConvert: () => void;
}) {
  const act = activities[plan.activity];
  const colors = colorsFor(act?.template ?? plan.template, c);
  const IconComp = act ? Icon[act.icon] : Icon.yoga;
  const d = dday(plan.dateISO, today);
  const dateLabel = d === 0 ? tr({ en: 'Today', ko: '오늘' }) : slashDayWeekday(plan.dateISO);
  const meta = `${dateLabel} ${displayTimeLabel(plan.timeLabel)} · ${plan.place ?? ''}`.trim();

  return (
    <>
      {showDivider && <View style={{ height: 1, backgroundColor: withAlpha(c.accent, 15), marginHorizontal: 9 }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9 }}>
        <View style={planIconWrap(c)}>
          <IconComp size={18} color={colors.color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{activityLabel(plan.activity)}</Text>
            {/* empty-ring "약속 미완료" dot on the first/today row */}
            {first && (
              <View
                accessibilityLabel={tr({ en: 'Plan incomplete', ko: '약속 미완료' })}
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
        {/* 기록으로 전환 — 기록 추가 화면을 약속 데이터로 프리필해 띄운다 */}
        <Pressable
          onPress={onConvert}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: `Convert ${activityLabel(plan.activity)} to record`, ko: `${activityLabel(plan.activity)} 기록으로 전환` })}
          style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.check size={15} color={c.accent} strokeWidth={2.6} />
        </Pressable>
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

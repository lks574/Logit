import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { IconButton } from '../../components/Button';
import { Icon } from '../../components/Glyph';
import { DdayBadge, Tag } from '../../components/badges';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { useStore } from '../../store/StoreContext';
import { dday, upcomingPlans } from '../../store/selectors';
import { activities, colorsFor, iconFor, activityLabel } from '../../data/activities';
import { StoredPlan } from '../../store/types';
import { tr } from '../../i18n/i18n';
import { displayTimeLabel } from '../../lib/date';

type Seg = 'past' | 'upcoming';

// 5.2 다가오는 약속 — 스토어 기반. 지난/예정 토글 + 날짜 그룹 + 약속 추가.
export default function PlansScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { today, plans } = useStore();
  const [seg, setSeg] = React.useState<Seg>('upcoming');

  const up = upcomingPlans(plans, today); // undone, future, asc
  const past = plans
    .filter((p) => p.done || dday(p.dateISO, today) < 0)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const todayPlans = up.filter((p) => dday(p.dateISO, today) === 0);
  const weekPlans = up.filter((p) => { const d = dday(p.dateISO, today); return d >= 1 && d <= 7; });
  const laterPlans = up.filter((p) => dday(p.dateISO, today) > 7);

  const wd = (iso: string) => [
    tr({ en: 'Sun', ko: '일' }),
    tr({ en: 'Mon', ko: '월' }),
    tr({ en: 'Tue', ko: '화' }),
    tr({ en: 'Wed', ko: '수' }),
    tr({ en: 'Thu', ko: '목' }),
    tr({ en: 'Fri', ko: '금' }),
    tr({ en: 'Sat', ko: '토' }),
  ][new Date(iso + 'T00:00:00Z').getUTCDay()];
  const dateLabel = (iso: string) =>
    dday(iso, today) === 0 ? tr({ en: 'Today', ko: '오늘' }) : `${+iso.slice(5, 7)}/${+iso.slice(8, 10)} (${wd(iso)})`;

  const resolve = (p: StoredPlan) => {
    const reg = activities[p.activity];
    const { color, soft } = colorsFor(reg?.template ?? p.template, c);
    return { color, soft, IconCmp: iconFor(p.activity) };
  };

  const PlanRow = ({ p }: { p: StoredPlan }) => {
    const { color, soft, IconCmp } = resolve(p);
    const d = dday(p.dateISO, today);
    const meta = [dateLabel(p.dateISO), displayTimeLabel(p.timeLabel), p.place].filter(Boolean).join(' · ');
    return (
      <Pressable
        onPress={() => nav.navigate('AddPlan', { planId: p.id })}
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
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
          <IconCmp size={19} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{activityLabel(p.activity)}</Text>
            {p.memo ? <Text numberOfLines={1} style={{ fontSize: 10, color: c.text3, flexShrink: 1 }}>· {p.memo}</Text> : null}
          </View>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: c.text2, marginTop: 2 }}>{meta}</Text>
        </View>
        {p.done ? (
          <Tag label={tr({ en: 'Done', ko: '완료' })} color={c.success} soft={withAlpha(c.success, 14)} />
        ) : d < 0 ? (
          <Tag label={tr({ en: 'Past', ko: '지남' })} color={c.text3} soft={c.surfaceAlt} />
        ) : (
          <DdayBadge days={d} color={color} />
        )}
      </Pressable>
    );
  };

  const Group = ({ label, items, color }: { label: string; items: StoredPlan[]; color: string }) =>
    items.length ? (
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label}</Text>
        {items.map((p) => (
          <PlanRow key={p.id} p={p} />
        ))}
      </View>
    ) : null;

  const upcomingCount = up.length;
  const empty = seg === 'upcoming' ? upcomingCount === 0 : past.length === 0;

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header + 지난/예정 toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <IconButton size={30} onPress={() => nav.goBack()}>
            <Icon.chevronLeft size={18} color={c.text2} strokeWidth={2.4} />
          </IconButton>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>{tr({ en: 'Upcoming plans', ko: '다가오는 약속' })}</Text>
            <Text style={{ fontSize: 12.5, color: c.text2, marginTop: 2 }}>
              {seg === 'upcoming'
                ? tr({ en: `${upcomingCount} upcoming`, ko: `앞으로 예정된 ${upcomingCount}건` })
                : tr({ en: `${past.length} past`, ko: `지난 ${past.length}건` })}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 999, padding: 3 }}>
          {(['past', 'upcoming'] as Seg[]).map((k) => {
            const active = seg === k;
            return (
              <Pressable
                key={k}
                onPress={() => setSeg(k)}
                hitSlop={4}
                style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: active ? c.accent : 'transparent' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : c.text2 }}>
                  {k === 'past' ? tr({ en: 'Past', ko: '지난' }) : tr({ en: 'Upcoming', ko: '예정' })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, paddingTop: 6, gap: 16 }}>
        {seg === 'upcoming' ? (
          <>
            <Group label={tr({ en: 'Today', ko: '오늘' })} items={todayPlans} color={c.accent} />
            <Group label={tr({ en: 'This week', ko: '이번 주' })} items={weekPlans} color={c.text2} />
            <Group label={tr({ en: 'Later', ko: '이후' })} items={laterPlans} color={c.text2} />
          </>
        ) : (
          <Group label={tr({ en: 'Past plans', ko: '지난 약속' })} items={past} color={c.text2} />
        )}

        {empty ? (
          <Text style={{ fontSize: 13, color: c.text3, textAlign: 'center', paddingVertical: 20 }}>
            {seg === 'upcoming' ? tr({ en: 'No upcoming plans.', ko: '예정된 약속이 없어요.' }) : tr({ en: 'No past plans.', ko: '지난 약속이 없어요.' })}
          </Text>
        ) : null}

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
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>{tr({ en: 'Add plan', ko: '약속 추가' })}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

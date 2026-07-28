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
import { ActionSheet } from '../../components/ActionSheet';
import { useToast } from '../../components/Toast';
import { dday, overduePlans, upcomingPlans } from '../../store/selectors';
import { activities, colorsFor, iconFor, activityLabel } from '../../data/activities';
import { StoredPlan } from '../../store/types';
import { tr } from '../../i18n/i18n';
import { displayTimeLabel } from '../../lib/date';

type Seg = 'past' | 'upcoming';

// 5.2 다가오는 약속 — 스토어 기반. 지난/예정 토글 + 날짜 그룹 + 약속 추가.
export default function PlansScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { today, plans, deletePlan, deletePlans, getRecord } = useStore();
  const [seg, setSeg] = React.useState<Seg>('upcoming');
  const [pendingDelete, setPendingDelete] = React.useState<StoredPlan | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const toast = useToast();

  // 완료 약속은 그 약속이 낳은 기록으로 가는 입구다. 링크가 없는 레거시 완료 약속은 편집 화면으로.
  const openPlan = (p: StoredPlan) => {
    if (p.done && p.recordId && getRecord(p.recordId)) {
      nav.navigate('Detail', { recordId: p.recordId });
      return;
    }
    nav.navigate('AddPlan', { planId: p.id });
  };

  // 약속 → 기록 전환: 기록 추가 화면을 약속 데이터로 프리필해 띄운다(저장 시 기록 생성 + 약속 완료).
  const convertToRecord = (p: StoredPlan) => nav.navigate('RecordForm', { activity: p.activity, template: p.template, planId: p.id });

  const up = upcomingPlans(plans, today); // undone, future, asc
  // 날짜가 지났는데 아직 안 한 약속은 '지난'이 아니라 '예정'에 둔다 — 여전히 처리해야 할 일이고,
  // 완료 목록에 섞이면 묻힌다(홈의 '이 약속, 기록했나요?'와 같은 기준).
  const overdue = overduePlans(plans, today);
  const past = plans.filter((p) => p.done).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

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
      // 카드 열기(수정)와 기록 전환 체크를 형제 Pressable로 분리 (중첩 시 체크 탭이 부모로 먹힘).
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 14,
          paddingVertical: 11,
          paddingHorizontal: 13,
        }}
      >
        <Pressable
          onPress={() => openPlan(p)}
          accessibilityRole="button"
          accessibilityLabel={
            p.done
              ? tr({ en: `Open the record from ${activityLabel(p.activity)}`, ko: `${activityLabel(p.activity)} 약속의 기록 열기` })
              : tr({ en: `Edit ${activityLabel(p.activity)} plan`, ko: `${activityLabel(p.activity)} 약속 수정` })
          }
          style={({ pressed }) => ({ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11, opacity: pressed ? 0.9 : 1 })}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Tag label={tr({ en: 'Done', ko: '완료' })} color={c.success} soft={withAlpha(c.success, 14)} />
              {/* 기록이 연결된 완료 약속만 이동 가능함을 표시 */}
              {p.recordId && getRecord(p.recordId) ? <Icon.chevronRight size={14} color={c.text3} strokeWidth={2.2} /> : null}
            </View>
          ) : d < 0 ? (
            <Tag label={tr({ en: 'Past', ko: '지남' })} color={c.text3} soft={c.surfaceAlt} />
          ) : (
            <DdayBadge days={d} color={color} />
          )}
        </Pressable>
        {/* 미완료 약속만 기록 전환 가능 */}
        {!p.done ? (
          <Pressable
            onPress={() => convertToRecord(p)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tr({ en: `Convert ${activityLabel(p.activity)} to record`, ko: `${activityLabel(p.activity)} 기록으로 전환` })}
            style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon.check size={16} color={c.accent} strokeWidth={2.6} />
          </Pressable>
        ) : null}
        {/* 삭제 — 편집 화면까지 들어가지 않고 목록에서 바로 정리할 수 있게. */}
        <Pressable
          onPress={() => setPendingDelete(p)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: `Delete ${activityLabel(p.activity)} plan`, ko: `${activityLabel(p.activity)} 약속 삭제` })}
          style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.trash size={16} color={c.text3} strokeWidth={1.9} />
        </Pressable>
      </View>
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
  const empty = seg === 'upcoming' ? upcomingCount === 0 && overdue.length === 0 : past.length === 0;

  const upcomingSubtitle = [
    tr({ en: `${upcomingCount} upcoming`, ko: `앞으로 예정된 ${upcomingCount}건` }),
    overdue.length ? tr({ en: `${overdue.length} not done`, ko: `아직 안 한 ${overdue.length}건` }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
                ? upcomingSubtitle
                : tr({ en: `${past.length} done`, ko: `완료한 ${past.length}건` })}
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
                  {k === 'past' ? tr({ en: 'Done', ko: '완료' }) : tr({ en: 'Upcoming', ko: '예정' })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, paddingTop: 6, gap: 16 }}>
        {seg === 'upcoming' ? (
          <>
            {/* 지났지만 아직 안 한 약속을 맨 위에 — 가장 먼저 처리해야 할 항목이다. */}
            <Group label={tr({ en: 'Not done yet', ko: '아직 안 함' })} items={overdue} color={c.warning} />
            <Group label={tr({ en: 'Today', ko: '오늘' })} items={todayPlans} color={c.accent} />
            <Group label={tr({ en: 'This week', ko: '이번 주' })} items={weekPlans} color={c.text2} />
            <Group label={tr({ en: 'Later', ko: '이후' })} items={laterPlans} color={c.text2} />
          </>
        ) : (
          <>
            <Group label={tr({ en: 'Completed plans', ko: '완료한 약속' })} items={past} color={c.text2} />
            {/* 완료 약속은 계속 쌓이므로 한 번에 정리할 수단을 준다(기록은 지워지지 않는다). */}
            {past.length ? (
              <Pressable
                onPress={() => setConfirmClear(true)}
                accessibilityRole="button"
                style={({ pressed }) => ({ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12, opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text3 }}>
                  {tr({ en: `Clear ${past.length} completed plans`, ko: `완료한 약속 ${past.length}건 정리` })}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}

        {empty ? (
          <Text style={{ fontSize: 13, color: c.text3, textAlign: 'center', paddingVertical: 20 }}>
            {seg === 'upcoming' ? tr({ en: 'No upcoming plans.', ko: '예정된 약속이 없어요.' }) : tr({ en: 'No completed plans.', ko: '완료한 약속이 없어요.' })}
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

      <ActionSheet
        visible={confirmClear}
        title={tr({ en: 'Clear completed plans', ko: '완료한 약속 정리' })}
        message={tr({
          en: `Removes ${past.length} completed plans. The records they created are kept.`,
          ko: `완료한 약속 ${past.length}건을 지웁니다. 그 약속으로 남긴 기록은 그대로 유지돼요.`,
        })}
        cancelLabel={tr({ en: 'Cancel', ko: '취소' })}
        onCancel={() => setConfirmClear(false)}
        actions={[
          {
            label: tr({ en: 'Clear', ko: '정리' }),
            destructive: true,
            onPress: () => {
              const count = past.length;
              deletePlans(past.map((p) => p.id));
              setConfirmClear(false);
              toast.show(tr({ en: `Cleared ${count} completed plans`, ko: `완료한 약속 ${count}건을 정리했어요` }));
            },
          },
        ]}
      />

      <ActionSheet
        visible={!!pendingDelete}
        title={tr({ en: 'Delete plan', ko: '약속 삭제' })}
        message={
          pendingDelete
            ? `${activityLabel(pendingDelete.activity)} · ${dateLabel(pendingDelete.dateISO)}\n${tr({ en: 'Delete this plan?', ko: '이 약속을 삭제할까요?' })}`
            : undefined
        }
        cancelLabel={tr({ en: 'Cancel', ko: '취소' })}
        onCancel={() => setPendingDelete(null)}
        actions={[
          {
            label: tr({ en: 'Delete', ko: '삭제' }),
            destructive: true,
            onPress: () => {
              if (!pendingDelete) return;
              deletePlan(pendingDelete.id);
              setPendingDelete(null);
              toast.show(tr({ en: 'Plan deleted', ko: '약속을 삭제했어요' }));
            },
          },
        ]}
      />
    </Screen>
  );
}

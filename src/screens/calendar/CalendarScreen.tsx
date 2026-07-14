import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { ActivityCard, PlanCard } from '../../components/cards';
import { Segmented } from '../../components/controls';
import { Tag } from '../../components/badges';
import { Icon } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { useStore } from '../../store/StoreContext';
import { recordsOn, plansOn, recordsCovering, recordEnd } from '../../store/selectors';
import { activities, colorsFor, activityLabel } from '../../data/activities';
import { tr } from '../../i18n/i18n';
import { displayTimeLabel } from '../../lib/date';

// 5.1 월간 캘린더 — 했던 것(채운 점) · 약속한 것(빈 링). Logit.dc.html 1196–1331.
// June 2026: 1일 = 월요일, 30일. Grid starts Sunday(일). Markers/agenda are now
// derived live from the offline store (records/plans) instead of hardcoded maps.

export default function CalendarScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { today, records, plans } = useStore();
  const route = useRoute<any>();
  const paramDate: string | undefined = route.params?.dateISO;
  const [selected, setSelected] = useState<string>(paramDate ?? today); // 선택일 (dateISO)
  const [mode, setMode] = useState<'month' | 'year'>('month'); // 월(기본) / 연 그리드
  // Displayed month. Init to selected/today's month; prev/next buttons move it.
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const base = paramDate ?? today;
    return { year: parseInt(base.slice(0, 4), 10), month: parseInt(base.slice(5, 7), 10) };
  });

  // 히트맵 등에서 특정 날짜로 진입 시(param 변경) 선택일·표시월 동기화.
  React.useEffect(() => {
    if (paramDate) {
      setSelected(paramDate);
      setView({ year: parseInt(paramDate.slice(0, 4), 10), month: parseInt(paramDate.slice(5, 7), 10) });
    }
  }, [paramDate]);

  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shiftMonth = (delta: number) =>
    setView((v) => {
      const m0 = v.month - 1 + delta; // 0-based
      return { year: v.year + Math.floor(m0 / 12), month: ((m0 % 12) + 12) % 12 + 1 };
    });
  // 헤더 이전/다음: 월 모드는 달을, 연 모드는 해를 이동.
  const shift = (delta: number) =>
    mode === 'year' ? setView((v) => ({ ...v, year: v.year + delta })) : shiftMonth(delta);
  const goToday = () => {
    setSelected(today);
    setView({ year: parseInt(today.slice(0, 4), 10), month: parseInt(today.slice(5, 7), 10) });
  };

  // Build the grid for the displayed month (leading blanks + month days +
  // trailing next-month spill). Each cell carries its dateISO → store lookup.
  const { year, month } = view;
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const nextY = month === 12 ? year + 1 : year;
  const nextM = month === 12 ? 1 : month + 1;
  const prevY = month === 1 ? year - 1 : year;
  const prevM = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
  const cells: { day: number; inMonth: boolean; dateISO: string }[] = [];
  // leading: 지난달 마지막 며칠 (다음달과 동일하게 표시 + 클릭 가능)
  for (let i = 0; i < firstWeekday; i++) {
    const d = daysInPrevMonth - firstWeekday + 1 + i;
    cells.push({ day: d, inMonth: false, dateISO: iso(prevY, prevM, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true, dateISO: iso(year, month, d) });
  let next = 1;
  while (cells.length % 7 !== 0) {
    const d = next++;
    cells.push({ day: d, inMonth: false, dateISO: iso(nextY, nextM, d) });
  }

  const weekdays = [
    { label: tr({ en: 'Sun', ko: '일' }), color: c.error },
    { label: tr({ en: 'Mon', ko: '월' }), color: c.text3 },
    { label: tr({ en: 'Tue', ko: '화' }), color: c.text3 },
    { label: tr({ en: 'Wed', ko: '수' }), color: c.text3 },
    { label: tr({ en: 'Thu', ko: '목' }), color: c.text3 },
    { label: tr({ en: 'Fri', ko: '금' }), color: c.text3 },
    { label: tr({ en: 'Sat', ko: '토' }), color: c.team },
  ];

  // Resolve an activity name → { color, soft, IconCmp } (registry, else record/plan template).
  const resolve = (name: string, template: string) => {
    const reg = activities[name];
    const tmpl = (reg?.template ?? template) as any;
    const { color, soft } = colorsFor(tmpl, c);
    const IconCmp = Icon[reg?.icon ?? 'yoga'];
    return { color, soft, IconCmp };
  };

  // 연간 뷰용 날짜 인덱스: dateISO → { 기록 색상들, 미완 약속 여부 }. 12개월×수십 셀의
  // 반복 조회를 한 번의 순회로 대체(성능).
  const dayIndex = useMemo(() => {
    const m: Record<string, { colors: string[]; hasPlan: boolean }> = {};
    records.forEach((r) => {
      (m[r.dateISO] ??= { colors: [], hasPlan: false }).colors.push(resolve(r.activity, r.template).color);
    });
    plans.forEach((p) => {
      if (!p.done) (m[p.dateISO] ??= { colors: [], hasPlan: false }).hasPlan = true;
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, plans, c]);

  // Selected-day agenda (live from store).
  const dayRecords = recordsCovering(records, selected); // 멀티데이 기록은 걸치는 모든 날에 노출
  // 멀티데이면 선택일이 며칠차인지, 하루면 기존 시간 라벨.
  const dayHint = (r: (typeof dayRecords)[number]) => {
    const end = recordEnd(r);
    if (end <= r.dateISO) return displayTimeLabel(r.timeLabel);
    const between = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
    return tr({ en: `Day ${between(r.dateISO, selected) + 1}/${between(r.dateISO, end) + 1}`, ko: `${between(r.dateISO, selected) + 1}일차/${between(r.dateISO, end) + 1}일` });
  };
  const dayPlans = plansOn(plans, selected).filter((p) => !p.done);
  const recordCount = dayRecords.length;
  const planCount = dayPlans.length;

  return (
    <Screen edges={['top']} scroll contentStyle={{ paddingBottom: 24 }}>
      {/* month header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          {mode === 'month' ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>{monthLabel(month)}</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: c.text3 }}>{year}</Text>
            </>
          ) : (
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>{year}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <RoundBtn onPress={() => shift(-1)}>
            <Icon.chevronLeft size={15} color={c.text2} strokeWidth={2.4} />
          </RoundBtn>
          <Pressable
            hitSlop={6}
            onPress={goToday}
            style={{
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: c.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'Today', ko: '오늘' })}</Text>
          </Pressable>
          <RoundBtn onPress={() => shift(1)}>
            <Icon.chevronRight size={15} color={c.text2} strokeWidth={2.4} />
          </RoundBtn>
        </View>
      </View>

      {/* 월/연 토글 */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
        <Segmented<'month' | 'year'>
          options={[
            { key: 'month', label: tr({ en: 'Month', ko: '월' }) },
            { key: 'year', label: tr({ en: 'Year', ko: '연' }) },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {mode === 'year' ? (
        <View style={{ paddingHorizontal: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <MiniMonth
              key={m}
              year={year}
              month={m}
              today={today}
              dayIndex={dayIndex}
              onPress={() => {
                setView({ year, month: m });
                setMode('month');
              }}
            />
          ))}
        </View>
      ) : (
      <View style={{ paddingHorizontal: 14 }}>
        {/* weekday row */}
        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
          {weekdays.map((w) => (
            <Text
              key={w.label}
              style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: w.color }}
            >
              {w.label}
            </Text>
          ))}
        </View>

        {/* grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((cell, i) => {
            const col = i % 7;
            const isSun = col === 0;
            const isSat = col === 6;
            const isSelected = cell.inMonth && cell.dateISO === selected;

            // Live markers: 단일일 기록 = 채운 점, 멀티데이(캠핑·여행) = 걸침 바(밴드),
            // 미완료 약속 = 빈 링. 한 날에 공존 가능.
            const dayHasPlan = plansOn(plans, cell.dateISO).some((p) => !p.done);
            const dotColors = recordsOn(records, cell.dateISO)
              .filter((r) => recordEnd(r) === r.dateISO)
              .map((r) => resolve(r.activity, r.template).color);
            const bars = recordsCovering(records, cell.dateISO)
              .filter((r) => recordEnd(r) > r.dateISO)
              .slice(0, 2)
              .map((r) => ({
                color: resolve(r.activity, r.template).color,
                start: r.dateISO === cell.dateISO,
                end: recordEnd(r) === cell.dateISO,
              }));

            let numColor = c.text;
            if (!cell.inMonth) numColor = isSat ? withAlpha(c.team, 55) : c.text3;
            else if (isSun) numColor = c.error;
            else if (isSat) numColor = c.team;

            return (
              <Pressable
                key={`${cell.inMonth ? 'i' : 'o'}${cell.day}-${i}`}
                onPress={() => {
                  setSelected(cell.dateISO);
                  // 다른 달(지난달/다음달) 날짜 탭 → 그 달로 이동해 선택이 보이도록.
                  if (!cell.inMonth) {
                    setView({ year: +cell.dateISO.slice(0, 4), month: +cell.dateISO.slice(5, 7) });
                  }
                }}
                style={{
                  width: `${100 / 7}%`,
                  height: 44,
                  alignItems: 'center',
                  paddingTop: 5,
                }}
              >
                {/* 숫자: 선택 여부와 무관하게 24px 고정 박스 → 탭 시 레이아웃 안 흔들림 */}
                <View style={{ height: 24, alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff', lineHeight: 14 }}>{cell.day}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12.5, fontWeight: '500', color: numColor, lineHeight: 14 }}>{cell.day}</Text>
                  )}
                </View>
                {/* 마커 — 셀 하단에 절대 고정 → 선택(원)에 밀리지 않고 밴드가 이웃과 정렬됨.
                    멀티데이 바는 전체 폭, 시작/종료만 라운드 캡 → 인접일과 연결돼 밴드처럼. */}
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 4, gap: 2 }}>
                  {bars.map((b, bi) => (
                    <View
                      key={`b${bi}`}
                      style={{
                        height: 4,
                        backgroundColor: b.color,
                        marginLeft: b.start ? 4 : 0,
                        marginRight: b.end ? 4 : 0,
                        borderTopLeftRadius: b.start ? 2 : 0,
                        borderBottomLeftRadius: b.start ? 2 : 0,
                        borderTopRightRadius: b.end ? 2 : 0,
                        borderBottomRightRadius: b.end ? 2 : 0,
                      }}
                    />
                  ))}
                  {dotColors.length || dayHasPlan ? (
                    <View style={{ flexDirection: 'row', gap: 2, height: 6, alignItems: 'center', justifyContent: 'center' }}>
                      {dotColors.map((color, mi) => (
                        <View key={`d${mi}`} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
                      ))}
                      {dayHasPlan ? (
                        <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: c.accent }} />
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* legend */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.text2 }} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: c.text2 }}>{tr({ en: 'Done', ko: '했던 것' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: c.accent }} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: c.text2 }}>{tr({ en: 'Planned', ko: '약속한 것' })}</Text>
          </View>
        </View>

        {/* selected-day agenda */}
        <View style={{ gap: 9, paddingTop: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{agendaTitle(selected, today)}</Text>
            <Text style={{ fontSize: 11, color: c.text3 }}>
              {tr({ en: `Records ${recordCount} · Plans ${planCount}`, ko: `기록 ${recordCount} · 약속 ${planCount}` })}
            </Text>
          </View>

          {recordCount + planCount > 0 ? (
            <>
              {dayRecords.map((r) => {
                const { color, soft, IconCmp } = resolve(r.activity, r.template);
                return (
                  <ActivityCard
                    key={r.id}
                    color={color}
                    soft={soft}
                    icon={<IconCmp size={18} color={color} />}
                    title={activityLabel(r.activity)}
                    time={dayHint(r)}
                    meta={r.meta}
                    ratingFilled={r.rating}
                    onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })}
                  />
                );
              })}
              {dayPlans.map((p) => {
                const { color, IconCmp } = resolve(p.activity, p.template);
                const meta = [displayTimeLabel(p.timeLabel), p.place].filter(Boolean).join(' · ');
                return (
                  <PlanCard
                    key={p.id}
                    icon={<IconCmp size={18} color={color} />}
                    title={activityLabel(p.activity)}
                    meta={meta}
                    tag={<Tag label={tr({ en: 'Upcoming', ko: '예정' })} color={c.accent} outline />}
                    onCheck={() => nav.navigate('RecordForm', { activity: p.activity, template: p.template, planId: p.id })}
                    onPress={() => nav.navigate('AddPlan', { planId: p.id })}
                  />
                );
              })}
            </>
          ) : (
            <Text style={{ fontSize: 12, color: c.text3, paddingVertical: 8 }}>
              {tr({ en: 'No records or plans for this day.', ko: '이 날의 기록이나 약속이 없어요.' })}
            </Text>
          )}

          {/* 선택일에 기록/약속 추가 (날짜 프리필) — 좌: 기록, 우: 약속 */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            {(() => {
              const addBtn = (label: string, onPress: () => void) => (
                <Pressable
                  onPress={onPress}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: withAlpha(c.accent, 45),
                    borderRadius: 12,
                    paddingVertical: 12,
                  }}
                >
                  <Icon.plus size={16} color={c.accent} strokeWidth={2.4} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>{label}</Text>
                </Pressable>
              );
              return (
                <>
                  {addBtn(tr({ en: 'Add record', ko: '기록 추가' }), () => nav.navigate('ActivitySelect', { dateISO: selected }))}
                  {addBtn(tr({ en: 'Add plan', ko: '약속 추가' }), () => nav.navigate('AddPlan', { dateISO: selected }))}
                </>
              );
            })()}
          </View>
        </View>
      </View>
      )}
    </Screen>
  );
}

function RoundBtn({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      hitSlop={6}
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: c.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

// 연간 뷰의 미니 월 그리드. 3열 배치, 기록 있는 날은 채운 점 / 미완 약속만 있는 날은 링.
// 탭하면 해당 월의 월 뷰로 진입.
function MiniMonth({
  year,
  month,
  today,
  dayIndex,
  onPress,
}: {
  year: number;
  month: number;
  today: string;
  dayIndex: Record<string, { colors: string[]; hasPlan: boolean }>;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Pressable onPress={onPress} style={{ width: '33.33%', padding: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: c.text, marginBottom: 4, marginLeft: 2 }}>
        {monthLabel(month)}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={{ width: `${100 / 7}%`, height: 15 }} />;
          const dateISO = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const hit = dayIndex[dateISO];
          const isToday = dateISO === today;
          const dot = hit?.colors[0];
          return (
            <View key={i} style={{ width: `${100 / 7}%`, height: 15, alignItems: 'center', justifyContent: 'center' }}>
              {dot ? (
                <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: dot, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 7.5, fontWeight: '700', color: '#fff', lineHeight: 9 }}>{d}</Text>
                </View>
              ) : hit?.hasPlan ? (
                <View style={{ width: 11, height: 11, borderRadius: 5.5, borderWidth: 1, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 7.5, fontWeight: '600', color: c.accent, lineHeight: 9 }}>{d}</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 8.5, color: isToday ? c.accent : c.text3, fontWeight: isToday ? '800' : '400', lineHeight: 11 }}>{d}</Text>
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

// 월 표시 라벨: 한국어는 "6월", 영어는 짧은 월 이름.
function monthLabel(month: number) {
  const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
  return tr({ en, ko: `${month}월` });
}

// "오늘 · 6월 30일 (월)" for today, else "6월 D일 (요일)". dateISO in June 2026.
function agendaTitle(dateISO: string, today: string) {
  const day = parseInt(dateISO.slice(8, 10), 10);
  const month = parseInt(dateISO.slice(5, 7), 10);
  const weekday = [
    tr({ en: 'Sun', ko: '일' }),
    tr({ en: 'Mon', ko: '월' }),
    tr({ en: 'Tue', ko: '화' }),
    tr({ en: 'Wed', ko: '수' }),
    tr({ en: 'Thu', ko: '목' }),
    tr({ en: 'Fri', ko: '금' }),
    tr({ en: 'Sat', ko: '토' }),
  ][new Date(dateISO + 'T00:00:00Z').getUTCDay()];
  const label = tr({ en: `${month}/${day} (${weekday})`, ko: `${month}월 ${day}일 (${weekday})` });
  return dateISO === today ? tr({ en: `Today · ${label}`, ko: `오늘 · ${label}` }) : label;
}

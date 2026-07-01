import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { ActivityCard, PlanCard } from '../components/cards';
import { Tag } from '../components/badges';
import { Icon } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/tokens';
import { useStore } from '../store/StoreContext';
import { recordsOn, plansOn } from '../store/selectors';
import { activities, colorsFor } from '../data/activities';

// 5.1 월간 캘린더 — 했던 것(채운 점) · 약속한 것(빈 링). Logit.dc.html 1196–1331.
// June 2026: 1일 = 월요일, 30일. Grid starts Sunday(일). Markers/agenda are now
// derived live from the offline store (records/plans) instead of hardcoded maps.

export default function CalendarScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { today, records, plans, completePlanAsRecord } = useStore();
  const [selected, setSelected] = useState<string>(today); // 선택일 (dateISO)
  // Displayed month. Init to today's month; prev/next buttons move it.
  const [view, setView] = useState<{ year: number; month: number }>(() => ({
    year: parseInt(today.slice(0, 4), 10),
    month: parseInt(today.slice(5, 7), 10), // 1–12
  }));

  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shiftMonth = (delta: number) =>
    setView((v) => {
      const m0 = v.month - 1 + delta; // 0-based
      return { year: v.year + Math.floor(m0 / 12), month: ((m0 % 12) + 12) % 12 + 1 };
    });
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
  const cells: { day: number; inMonth: boolean; dateISO: string }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: 0, inMonth: false, dateISO: '' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true, dateISO: iso(year, month, d) });
  let next = 1;
  while (cells.length % 7 !== 0) {
    const d = next++;
    cells.push({ day: d, inMonth: false, dateISO: iso(nextY, nextM, d) });
  }
  const FIRST_WEEKDAY = firstWeekday; // used by leading-blank guard below

  const weekdays = [
    { label: '일', color: c.error },
    { label: '월', color: c.text3 },
    { label: '화', color: c.text3 },
    { label: '수', color: c.text3 },
    { label: '목', color: c.text3 },
    { label: '금', color: c.text3 },
    { label: '토', color: c.team },
  ];

  // Resolve an activity name → { color, soft, IconCmp } (registry, else record/plan template).
  const resolve = (name: string, template: string) => {
    const reg = activities[name];
    const tmpl = (reg?.template ?? template) as any;
    const { color, soft } = colorsFor(tmpl, c);
    const IconCmp = Icon[reg?.icon ?? 'yoga'];
    return { color, soft, IconCmp };
  };

  // Selected-day agenda (live from store).
  const dayRecords = recordsOn(records, selected);
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
          <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>{month}월</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: c.text3 }}>{year}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <RoundBtn onPress={() => shiftMonth(-1)}>
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
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>오늘</Text>
          </Pressable>
          <RoundBtn onPress={() => shiftMonth(1)}>
            <Icon.chevronRight size={15} color={c.text2} strokeWidth={2.4} />
          </RoundBtn>
        </View>
      </View>

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
            if (!cell.day && !cell.inMonth && i < FIRST_WEEKDAY) {
              return <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
            }
            const col = i % 7;
            const isSun = col === 0;
            const isSat = col === 6;
            const isSelected = cell.inMonth && cell.dateISO === selected;

            // Live markers: FILLED dot(s) per record (template color), EMPTY ring
            // if any undone plan exists that day. A day can show both.
            const dayRecs = recordsOn(records, cell.dateISO);
            const dayHasPlan = plansOn(plans, cell.dateISO).some((p) => !p.done);
            const dotColors = dayRecs.map((r) => resolve(r.activity, r.template).color);

            let numColor = c.text;
            if (!cell.inMonth) numColor = isSat ? withAlpha(c.team, 55) : c.text3;
            else if (isSun) numColor = c.error;
            else if (isSat) numColor = c.team;

            return (
              <Pressable
                key={`${cell.inMonth ? 'i' : 'o'}${cell.day}-${i}`}
                onPress={() => cell.inMonth && setSelected(cell.dateISO)}
                style={{
                  width: `${100 / 7}%`,
                  height: 44,
                  alignItems: 'center',
                  paddingTop: isSelected ? 2 : 5,
                  gap: isSelected ? 2 : 3,
                }}
              >
                {isSelected ? (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: c.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff', lineHeight: 14 }}>
                      {cell.day}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 12.5, fontWeight: '500', color: numColor, lineHeight: 14 }}>
                    {cell.day}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 2, height: 6, alignItems: 'center' }}>
                  {dotColors.map((color, mi) => (
                    <View
                      key={`d${mi}`}
                      style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }}
                    />
                  ))}
                  {dayHasPlan ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        borderWidth: 1.5,
                        borderColor: c.accent,
                      }}
                    />
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
            <Text style={{ fontSize: 11, fontWeight: '500', color: c.text2 }}>했던 것</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: c.accent }} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: c.text2 }}>약속한 것</Text>
          </View>
        </View>

        {/* selected-day agenda */}
        <View style={{ gap: 9, paddingTop: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{agendaTitle(selected, today)}</Text>
            <Text style={{ fontSize: 11, color: c.text3 }}>
              기록 {recordCount} · 약속 {planCount}
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
                    title={r.activity}
                    time={r.timeLabel}
                    meta={r.meta}
                    ratingFilled={r.rating}
                    onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })}
                  />
                );
              })}
              {dayPlans.map((p) => {
                const { color, IconCmp } = resolve(p.activity, p.template);
                const meta = [p.timeLabel, p.place].filter(Boolean).join(' · ');
                return (
                  <PlanCard
                    key={p.id}
                    icon={<IconCmp size={18} color={color} />}
                    title={p.activity}
                    meta={meta}
                    tag={<Tag label="예정" color={c.accent} outline />}
                    onCheck={() => {
                      const rec = completePlanAsRecord(p.id);
                      if (rec) nav.navigate('Detail', { activity: rec.activity, recordId: rec.id });
                    }}
                    onPress={() => nav.navigate('AddPlan', { planId: p.id })}
                  />
                );
              })}
            </>
          ) : (
            <Text style={{ fontSize: 12, color: c.text3, paddingVertical: 8 }}>
              이 날의 기록이나 약속이 없어요.
            </Text>
          )}

          {/* 선택일에 약속 추가 (날짜 프리필) */}
          <Pressable
            onPress={() => nav.navigate('AddPlan', { dateISO: selected })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: withAlpha(c.accent, 45),
              borderRadius: 12,
              paddingVertical: 12,
              marginTop: 2,
            }}
          >
            <Icon.plus size={16} color={c.accent} strokeWidth={2.4} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>이 날 약속 추가</Text>
          </Pressable>
        </View>
      </View>
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

// "오늘 · 6월 30일 (월)" for today, else "6월 D일 (요일)". dateISO in June 2026.
function agendaTitle(dateISO: string, today: string) {
  const day = parseInt(dateISO.slice(8, 10), 10);
  const month = parseInt(dateISO.slice(5, 7), 10);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(dateISO + 'T00:00:00Z').getUTCDay()
  ];
  const label = `${month}월 ${day}일 (${weekday})`;
  return dateISO === today ? `오늘 · ${label}` : label;
}

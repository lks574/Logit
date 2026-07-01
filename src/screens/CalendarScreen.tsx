import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { ActivityCard, PlanCard } from '../components/cards';
import { Tag } from '../components/badges';
import { Icon } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { radius, withAlpha } from '../theme/tokens';

// 5.1 월간 캘린더 — 했던 것(채운 점) · 약속한 것(빈 링). Logit.dc.html 1196–1331.
// June 2026: 1일 = 월요일, 30일. Grid starts Sunday(일).

type Marker = { type: 'done'; color: string } | { type: 'plan'; color: string };
type Agenda = { records: RecordItem[]; plans: PlanItem[] };
type RecordItem = { activity: string; template: string; title: string; time: string; meta: string; rating?: number };
type PlanItem = { title: string; time: string; place: string; iconColor: string };

export default function CalendarScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const [selected, setSelected] = useState(30); // 오늘 = 6월 30일
  const [, setChecked] = useState<Record<string, boolean>>({});
  const nextMarkers = useNextMonthMarkers();

  // Template → resolved color for markers (matches HTML var() usage).
  const done = (color: string): Marker => ({ type: 'done', color });
  const plan = (color: string): Marker => ({ type: 'plan', color });

  // Marked days (HTML 1239–1280). Day → markers[].
  const markers: Record<number, Marker[]> = useMemo(
    () => ({
      2: [done(c.strength)],
      5: [done(c.cardio)],
      8: [done(c.team)],
      12: [done(c.strength)],
      15: [done(c.cardio)],
      18: [done(c.perf)],
      22: [done(c.cardio)],
      24: [done(c.strength)],
      26: [done(c.cardio)],
      29: [done(c.perf)],
      30: [done(c.cardio), plan(c.accent)],
    }),
    [c],
  );

  // Agenda per day. Only 30일 has content in the HTML.
  const agendas: Record<number, Agenda> = useMemo(
    () => ({
      30: {
        records: [
          {
            activity: '런닝',
            template: 'endurance',
            title: '런닝',
            time: '오후 6:30',
            meta: '한강공원 · 5.2km',
            rating: 4,
          },
        ],
        plans: [{ title: '헬스', time: '오후 8:00', place: '홈짐', iconColor: c.strength }],
      },
    }),
    [c],
  );

  // Build 6-row grid. June 2026: 1일 Mon → 1 leading blank (Sunday col empty),
  // trailing days spill into July (1–5).
  const JUNE_DAYS = 30;
  const FIRST_WEEKDAY = 1; // 0=Sun … 1=Mon
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < FIRST_WEEKDAY; i++) cells.push({ day: 0, inMonth: false });
  for (let d = 1; d <= JUNE_DAYS; d++) cells.push({ day: d, inMonth: true });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, inMonth: false });

  const weekdays = [
    { label: '일', color: c.error },
    { label: '월', color: c.text3 },
    { label: '화', color: c.text3 },
    { label: '수', color: c.text3 },
    { label: '목', color: c.text3 },
    { label: '금', color: c.text3 },
    { label: '토', color: c.team },
  ];

  const agenda = agendas[selected];
  const recordCount = agenda?.records.length ?? 0;
  const planCount = agenda?.plans.length ?? 0;

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
          <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.44, color: c.text }}>6월</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: c.text3 }}>2026</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <RoundBtn>
            <Icon.chevronLeft size={15} color={c.text2} strokeWidth={2.4} />
          </RoundBtn>
          <Pressable
            hitSlop={6}
            onPress={() => setSelected(30)}
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
          <RoundBtn>
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
            const isSelected = cell.inMonth && cell.day === selected;
            const dayMarkers = cell.inMonth ? markers[cell.day] ?? [] : nextMarkers[cell.day] ?? [];

            let numColor = c.text;
            if (!cell.inMonth) numColor = isSat ? withAlpha(c.team, 55) : c.text3;
            else if (isSun) numColor = c.error;
            else if (isSat) numColor = c.team;

            return (
              <Pressable
                key={`${cell.inMonth ? 'i' : 'o'}${cell.day}-${i}`}
                onPress={() => cell.inMonth && setSelected(cell.day)}
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
                  {dayMarkers.map((m, mi) =>
                    m.type === 'done' ? (
                      <View
                        key={mi}
                        style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: m.color }}
                      />
                    ) : (
                      <View
                        key={mi}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          borderWidth: 1.5,
                          borderColor: m.color,
                        }}
                      />
                    ),
                  )}
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
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{agendaTitle(selected)}</Text>
            <Text style={{ fontSize: 11, color: c.text3 }}>
              기록 {recordCount} · 약속 {planCount}
            </Text>
          </View>

          {agenda ? (
            <>
              {agenda.records.map((r, i) => (
                <ActivityCard
                  key={`r${i}`}
                  color={c.cardio}
                  soft={c.cardioSoft}
                  icon={<Icon.running size={18} color={c.cardio} />}
                  title={r.title}
                  time={r.time}
                  meta={`${r.meta} · ★★★★`}
                  onPress={() => nav.navigate('Detail', { activity: r.activity })}
                />
              ))}
              {agenda.plans.map((p, i) => {
                const key = `${selected}-${i}`;
                return (
                  <PlanCard
                    key={`p${i}`}
                    icon={<Icon.dumbbell size={18} color={p.iconColor} />}
                    title={p.title}
                    meta={`${p.time} · ${p.place}`}
                    tag={<Tag label="예정" color={c.accent} outline />}
                    onCheck={() => setChecked((s) => ({ ...s, [key]: !s[key] }))}
                    onPress={() => nav.navigate('AddPlan')}
                  />
                );
              })}
            </>
          ) : (
            <Text style={{ fontSize: 12, color: c.text3, paddingVertical: 8 }}>
              이 날의 기록이나 약속이 없어요.
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}

// Days spilling into July that carry markers (HTML 1277–1280).
function useNextMonthMarkers() {
  const { c } = useTheme();
  return useMemo<Record<number, Marker[]>>(
    () => ({
      2: [{ type: 'plan', color: c.team }],
      3: [{ type: 'plan', color: c.perf }],
      5: [{ type: 'plan', color: c.cardio }],
    }),
    [c],
  );
}

function RoundBtn({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      hitSlop={6}
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

function agendaTitle(day: number) {
  if (day === 30) return '오늘 · 6월 30일 (월)';
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][(day - 1 + 1) % 7]; // 1일=월(1)
  return `6월 ${day}일 (${weekday})`;
}

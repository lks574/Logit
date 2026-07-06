import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Glyph';
import { tr } from '../i18n/i18n';

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthName = (month: number) => MONTH_EN[month - 1];

// Compact month-grid date picker (pure Views → works on every platform incl.
// web preview). Value/onChange are 'YYYY-MM-DD'.
export function MiniMonthPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { c } = useTheme();
  const [view, setView] = useState(() => ({ year: +value.slice(0, 4), month: +value.slice(5, 7) }));

  // value의 연/월이 바뀌면 표시 월도 그 달로 동기화(선택 날짜와 달력 월 불일치 방지).
  const ym = value.slice(0, 7);
  useEffect(() => {
    setView({ year: +ym.slice(0, 4), month: +ym.slice(5, 7) });
  }, [ym]);

  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shift = (delta: number) =>
    setView((v) => {
      const m0 = v.month - 1 + delta;
      return { year: v.year + Math.floor(m0 / 12), month: ((m0 % 12) + 12) % 12 + 1 };
    });

  const { year, month } = view;
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null); // 마지막 주를 7칸으로 패딩
  // 주 단위로 끊는다 — 줄마다 flex:1 7칸(퍼센트+wrap의 서브픽셀 반올림으로 토요일이 밀리는 것 방지).
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const weekdays = [
    tr({ en: 'Sun', ko: '일' }),
    tr({ en: 'Mon', ko: '월' }),
    tr({ en: 'Tue', ko: '화' }),
    tr({ en: 'Wed', ko: '수' }),
    tr({ en: 'Thu', ko: '목' }),
    tr({ en: 'Fri', ko: '금' }),
    tr({ en: 'Sat', ko: '토' }),
  ];

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: 10,
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 6 }}>
        <Pressable onPress={() => shift(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr({ en: 'Previous month', ko: '이전 달' })} style={{ padding: 4 }}>
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{tr({ en: `${monthName(month)} ${year}`, ko: `${year}년 ${month}월` })}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr({ en: 'Next month', ko: '다음 달' })} style={{ padding: 4 }}>
          <Icon.chevronRight size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((w, i) => (
          <Text
            key={w}
            style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: i === 0 ? c.error : i === 6 ? c.team : c.text3 }}
          >
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((d, col) => {
            if (d == null) return <View key={`b${wi}-${col}`} style={{ flex: 1, height: 34 }} />;
            const cellISO = iso(year, month, d);
            const selected = cellISO === value;
            return (
              <Pressable
                key={cellISO}
                onPress={() => onChange(cellISO)}
                style={{ flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? c.accent : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? '#fff' : col === 0 ? c.error : col === 6 ? c.team : c.text,
                    }}
                  >
                    {d}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

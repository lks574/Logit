import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Glyph';

// Compact month-grid date picker (pure Views → works on every platform incl.
// web preview). Value/onChange are 'YYYY-MM-DD'.
export function MiniMonthPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { c } = useTheme();
  const [view, setView] = useState(() => ({ year: +value.slice(0, 4), month: +value.slice(5, 7) }));

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

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

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
        <Pressable onPress={() => shift(-1)} hitSlop={8} style={{ padding: 4 }}>
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{`${year}년 ${month}월`}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={8} style={{ padding: 4 }}>
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d == null) return <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: 34 }} />;
          const cellISO = iso(year, month, d);
          const selected = cellISO === value;
          const col = i % 7;
          return (
            <Pressable
              key={cellISO}
              onPress={() => onChange(cellISO)}
              style={{ width: `${100 / 7}%`, height: 34, alignItems: 'center', justifyContent: 'center' }}
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
    </View>
  );
}

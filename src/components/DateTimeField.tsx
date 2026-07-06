import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Glyph, Path, Rect, Circle } from './Glyph';
import { Segmented } from './controls';
import { MiniMonthPicker } from './MiniMonthPicker';
import { useTheme } from '../theme/ThemeContext';

// 날짜·시간 편집 필드(폼 공용). dateISO='YYYY-MM-DD', timeLabel='오전/오후 H:MM'.
// 탭하면 인라인 달력 / 시간 피커가 펼쳐진다.

const dateLabel = (iso: string) => {
  const wd = ['일', '월', '화', '수', '목', '금', '토'][new Date(iso + 'T00:00:00Z').getUTCDay()];
  return `${+iso.slice(5, 7)}월 ${+iso.slice(8, 10)}일 (${wd})`;
};
const parseTime = (label?: string) => {
  const m = label?.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!m) return { ampm: '오후' as '오전' | '오후', h12: 3, minute: 0 };
  return { ampm: m[1] as '오전' | '오후', h12: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
};
export const timeLabelOf = (ampm: string, h12: number, minute: number) =>
  `${ampm} ${h12}:${String(minute).padStart(2, '0')}`;

// 현재 시각 → 'YYYY-MM-DD' / '오전·오후 H:MM' (신규 기록 기본값).
export function nowDateISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function nowTimeLabel(): string {
  const d = new Date();
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return timeLabelOf(ampm, h12, d.getMinutes());
}

export function DateTimeField({
  dateISO,
  timeLabel,
  onChangeDate,
  onChangeTime,
  color,
}: {
  dateISO: string;
  timeLabel: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (label: string) => void;
  color?: string;
}) {
  const { c } = useTheme();
  const accent = color ?? c.accent;
  const [showDate, setShowDate] = React.useState(false);
  const [showTime, setShowTime] = React.useState(false);
  const { ampm, h12, minute } = parseTime(timeLabel);

  const setTime = (next: { ampm?: '오전' | '오후'; h12?: number; minute?: number }) =>
    onChangeTime(timeLabelOf(next.ampm ?? ampm, next.h12 ?? h12, next.minute ?? minute));

  const box = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 9,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 13,
  };

  const Wheel = ({ value, onDec, onInc }: { value: string; onDec: () => void; onInc: () => void }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onDec} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: c.text2 }}>−</Text>
      </Pressable>
      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text, minWidth: 40, textAlign: 'center' }}>{value}</Text>
      <Pressable onPress={onInc} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: c.text2 }}>＋</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable style={[box, { flex: 1.4 }]} onPress={() => { setShowDate((s) => !s); setShowTime(false); }}>
          <Glyph size={17} color={accent}>
            <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
            <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </Glyph>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{dateLabel(dateISO)}</Text>
        </Pressable>
        <Pressable style={[box, { flex: 1 }]} onPress={() => { setShowTime((s) => !s); setShowDate(false); }}>
          <Glyph size={17} color={accent}>
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v5l3.5 2" />
          </Glyph>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{timeLabelOf(ampm, h12, minute)}</Text>
        </Pressable>
      </View>

      {showDate ? (
        <MiniMonthPicker value={dateISO} onChange={(iso) => { onChangeDate(iso); setShowDate(false); }} />
      ) : null}

      {showTime ? (
        <View style={{ gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12 }}>
          <Segmented
            options={[{ key: '오전', label: '오전' }, { key: '오후', label: '오후' }]}
            value={ampm}
            onChange={(v) => setTime({ ampm: v as '오전' | '오후' })}
            color={accent}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <Wheel value={`${h12}시`} onDec={() => setTime({ h12: h12 === 1 ? 12 : h12 - 1 })} onInc={() => setTime({ h12: h12 === 12 ? 1 : h12 + 1 })} />
            <Wheel value={`${String(minute).padStart(2, '0')}분`} onDec={() => setTime({ minute: (minute + 55) % 60 })} onInc={() => setTime({ minute: (minute + 5) % 60 })} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

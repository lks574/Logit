import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Glyph, Path, Rect, Circle } from './Glyph';
import { Segmented } from './controls';
import { MiniMonthPicker } from './MiniMonthPicker';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';
import { monthDayWeekday } from '../lib/date';

// 날짜·시간 편집 필드(폼 공용). dateISO='YYYY-MM-DD', timeLabel='오전/오후 H:MM'.
// 탭하면 인라인 달력 / 시간 피커가 펼쳐진다.

const parseTime = (label?: string) => {
  const m = label?.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!m) return { ampm: '오후' as '오전' | '오후', h12: 3, minute: 0 };
  return { ampm: m[1] as '오전' | '오후', h12: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
};
export const timeLabelOf = (ampm: string, h12: number, minute: number) =>
  `${ampm} ${h12}:${String(minute).padStart(2, '0')}`;

// 신규 기록 기본값 — 실제 현재 날짜/시각(lib/date). 기존 import 경로 유지 위해 re-export.
export { nowDateISO, nowTimeLabel } from '../lib/date';
import { nowTimeLabel as _nowTimeLabel } from '../lib/date';

export function DateTimeField({
  dateISO,
  timeLabel,
  onChangeDate,
  onChangeTime,
  color,
  allowNoTime,
}: {
  dateISO: string;
  timeLabel: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (label: string) => void;
  color?: string;
  allowNoTime?: boolean; // true면 시간을 비울 수 있음("시간 미정")
}) {
  const { c } = useTheme();
  const accent = color ?? c.accent;
  const [showDate, setShowDate] = React.useState(false);
  const [showTime, setShowTime] = React.useState(false);
  const hasTime = timeLabel.trim() !== '';
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{monthDayWeekday(dateISO)}</Text>
        </Pressable>
        <Pressable
          style={[box, { flex: 1 }]}
          onPress={() => {
            if (allowNoTime && !hasTime) {
              onChangeTime(_nowTimeLabel()); // 미정 → 현재 시각으로 켜기
              setShowTime(true);
            } else {
              setShowTime((s) => !s);
            }
            setShowDate(false);
          }}
        >
          <Glyph size={17} color={hasTime ? accent : c.text3}>
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v5l3.5 2" />
          </Glyph>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: hasTime ? c.text : c.text3 }}>
            {hasTime ? timeLabelOf(ampm, h12, minute) : tr({ en: 'No time', ko: '시간 미정' })}
          </Text>
          {allowNoTime && hasTime ? (
            <Pressable
              onPress={() => { onChangeTime(''); setShowTime(false); }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={tr({ en: 'Clear time', ko: '시간 지우기' })}
            >
              <Glyph size={15} color={c.text3} strokeWidth={2.4}>
                <Path d="M6 6l12 12M18 6l-12 12" />
              </Glyph>
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      {showDate ? (
        <MiniMonthPicker value={dateISO} onChange={(iso) => { onChangeDate(iso); setShowDate(false); }} />
      ) : null}

      {showTime && hasTime ? (
        <View style={{ gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12 }}>
          <Segmented
            options={[{ key: '오전', label: tr({ en: 'AM', ko: '오전' }) }, { key: '오후', label: tr({ en: 'PM', ko: '오후' }) }]}
            value={ampm}
            onChange={(v) => setTime({ ampm: v as '오전' | '오후' })}
            color={accent}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <Wheel value={tr({ en: `${h12} h`, ko: `${h12}시` })} onDec={() => setTime({ h12: h12 === 1 ? 12 : h12 - 1 })} onInc={() => setTime({ h12: h12 === 12 ? 1 : h12 + 1 })} />
            <Wheel value={tr({ en: `${String(minute).padStart(2, '0')} m`, ko: `${String(minute).padStart(2, '0')}분` })} onDec={() => setTime({ minute: (minute + 55) % 60 })} onInc={() => setTime({ minute: (minute + 5) % 60 })} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

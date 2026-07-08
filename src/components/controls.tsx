import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';

// useHoldRepeat — onPressIn 시 즉시 1회 실행, 계속 누르면 딜레이 후 반복.
// 단순 탭 = 1스텝, 롱프레스 = 연속 변경. Pressable에 {...} 스프레드로 붙인다.
// action은 매 렌더 최신값을 ref에 담아, 누르는 동안 갱신된 상태를 반영한다.
export function useHoldRepeat(action: () => void, { delay = 400, interval = 70 } = {}) {
  const to = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const iv = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const act = React.useRef(action);
  act.current = action;
  const stop = React.useCallback(() => {
    if (to.current) clearTimeout(to.current);
    if (iv.current) clearInterval(iv.current);
    to.current = null;
    iv.current = null;
  }, []);
  React.useEffect(() => stop, [stop]); // 언마운트 시 타이머 정리
  const start = React.useCallback(() => {
    act.current(); // 즉시 1회 (단순 탭 = 1)
    to.current = setTimeout(() => {
      iv.current = setInterval(() => act.current(), interval);
    }, delay);
  }, [delay, interval]);
  return { onPressIn: start, onPressOut: stop };
}

// Wheel — −/value/＋ 스텝퍼. 단순 탭=1스텝, 롱프레스=연속 변경(useHoldRepeat).
// top-level 컴포넌트라 부모 리렌더에도 리마운트되지 않아 롱프레스 타이머가 유지된다.
export function Wheel({
  value,
  onDec,
  onInc,
  minWidth = 40,
}: {
  value: string;
  onDec: () => void;
  onInc: () => void;
  minWidth?: number;
}) {
  const { c } = useTheme();
  const dec = useHoldRepeat(onDec);
  const inc = useHoldRepeat(onInc);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable {...dec} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: c.text2 }}>−</Text>
      </Pressable>
      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text, minWidth, textAlign: 'center' }}>{value}</Text>
      <Pressable {...inc} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: c.text2 }}>＋</Text>
      </Pressable>
    </View>
  );
}

// Toggle — 44x26, on = accent. Gallery §07.
export function Toggle({ value, onChange, color, label }: { value: boolean; onChange?: (v: boolean) => void; color?: string; label?: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        backgroundColor: value ? color ?? c.accent : c.surfaceAlt,
        borderWidth: value ? 0 : 1,
        borderColor: c.border,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fff',
          marginLeft: value ? 21 : 2,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

// Segmented — surface-alt track + selected pill. Gallery §07.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  color,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  color?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: c.surfaceAlt, borderRadius: 11, padding: 4 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: active ? color ?? c.accent : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: active ? '700' : '600', color: active ? '#fff' : c.text2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Stepper — − / value / ＋. Gallery §07.
export function Stepper({
  value,
  onChange,
  format,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
}) {
  const { c } = useTheme();
  const btn = (label: string, a11y: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: c.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 17, color: c.text2 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {btn('−', tr({ en: 'Decrease', ko: '감소' }), () => onChange(Math.max(0, value - 1)))}
      <Text style={{ fontSize: 16, fontWeight: '700', color: color ?? c.text, minWidth: 28, textAlign: 'center' }}>
        {format ? format(value) : value}
      </Text>
      {btn('＋', tr({ en: 'Increase', ko: '증가' }), () => onChange(value + 1))}
    </View>
  );
}

// Chip — selectable pill. Solid(selected) / outline / dashed(add).
export function Chip({
  label,
  selected,
  dashed,
  icon,
  color,
  onPress,
}: {
  label: string;
  selected?: boolean;
  dashed?: boolean;
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const accent = color ?? c.accent;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        paddingVertical: 7,
        paddingHorizontal: 13,
        backgroundColor: selected ? accent : c.surface,
        borderWidth: selected ? 0 : 1,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: c.border,
      }}
    >
      {icon}
      <Text style={{ fontSize: 13, fontWeight: selected ? '600' : '400', color: selected ? '#fff' : c.text2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

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
      {btn('−', '감소', () => onChange(Math.max(0, value - 1)))}
      <Text style={{ fontSize: 16, fontWeight: '700', color: color ?? c.text, minWidth: 28, textAlign: 'center' }}>
        {format ? format(value) : value}
      </Text>
      {btn('＋', '증가', () => onChange(value + 1))}
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

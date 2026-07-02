import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Glyph, Path } from './Glyph';

// Stars — filled ★ in --star, empty ★ in --text3. Read-only display.
export function Stars({ filled, total = 5, size = 12 }: { filled: number; total?: number; size?: number }) {
  const { c } = useTheme();
  return (
    <Text style={{ fontSize: size, letterSpacing: 1 }}>
      <Text style={{ color: c.star }}>{'★'.repeat(Math.max(0, Math.min(total, filled)))}</Text>
      <Text style={{ color: c.text3 }}>{'★'.repeat(Math.max(0, total - filled))}</Text>
    </Text>
  );
}

// RatingInput — tappable 5-star selector.
export function RatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`${n}점`}
          accessibilityState={{ selected: n <= value }}
        >
          <Text style={{ fontSize: size, color: n <= value ? c.star : c.text3 }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

// CompanionChip — avatar initial + name. dashed=add.
export function CompanionChip({ name, dashed, onPress }: { name: string; dashed?: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  if (dashed) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: c.border,
          borderRadius: 999,
          paddingVertical: 4,
          paddingHorizontal: 11,
        }}
      >
        <Glyph size={12} color={c.text3} strokeWidth={2.4}>
          <Path d="M12 5v14M5 12h14" />
        </Glyph>
        <Text style={{ fontSize: 12, color: c.text3 }}>{name}</Text>
      </Pressable>
    );
  }
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 999,
        paddingVertical: 4,
        paddingLeft: 5,
        paddingRight: 10,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{name.slice(0, 1)}</Text>
      </View>
      <Text style={{ fontSize: 12, color: c.text2 }}>{name}</Text>
    </Wrap>
  );
}

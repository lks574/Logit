import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Glyph, Path } from './Glyph';

// 별 하나를 fill(0..1)만큼 채워 그린다: 빈 별 위에 채운 별을 width로 클립.
// 0.5 단위 평점을 표현하려고 반쪽 채움을 지원한다.
function Star({ fill, size }: { fill: number; size: number }) {
  const { c } = useTheme();
  const w = Math.max(0, Math.min(1, fill)) * size;
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ position: 'absolute', fontSize: size, lineHeight: size, color: c.text3 }}>★</Text>
      <View style={{ position: 'absolute', width: w, height: size, overflow: 'hidden' }}>
        <Text style={{ fontSize: size, lineHeight: size, color: c.star }}>★</Text>
      </View>
    </View>
  );
}

// Stars — 읽기 전용 표시. 0.5 단위 반영.
export function Stars({ filled, total = 5, size = 12 }: { filled: number; total?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} fill={filled - i} size={size} />
      ))}
    </View>
  );
}

// RatingInput — 별 하나를 좌/우 반으로 나눠 탭 → 0.5 단위 선택.
export function RatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={{ width: size, height: size }}>
          <Star fill={value - (n - 1)} size={size} />
          <Pressable
            onPress={() => onChange(n - 0.5)}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${n - 0.5}점`}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: size / 2 }}
          />
          <Pressable
            onPress={() => onChange(n)}
            hitSlop={{ top: 6, bottom: 6, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`${n}점`}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: size / 2 }}
          />
        </View>
      ))}
    </View>
  );
}

// CompanionChip — avatar initial + name. dashed=add. onRemove가 있으면 × 노출.
export function CompanionChip({
  name,
  dashed,
  onPress,
  onRemove,
}: {
  name: string;
  dashed?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}) {
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
  return (
    <View
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
        paddingRight: onRemove ? 5 : 10,
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
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${name} 삭제`}
          style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Glyph size={9} color={c.text2} strokeWidth={2.6}>
            <Path d="M6 6l12 12M18 6l-12 12" />
          </Glyph>
        </Pressable>
      ) : null}
    </View>
  );
}

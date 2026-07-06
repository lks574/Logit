import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Glyph, Path } from './Glyph';
import { tr } from '../i18n/i18n';

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

// 평점을 0.0~5.0, 0.1 단위로 정규화.
const clampRating = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));

// RatingInput — 별 위를 탭/드래그하면 위치에 비례해 평점(0.0~5.0, 0.1 단위)이 매겨진다.
// 별은 연속 채움이라 4.7 같은 값도 시각적으로 표현된다.
const STAR_GAP = 4;
export function RatingInput({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const { c } = useTheme();
  const [w, setW] = React.useState(0);
  // 드래그/탭 x좌표 → 평점. 전체 폭(별+간격)을 0~5로 매핑.
  const fromX = (x: number) => {
    if (w <= 0) return value;
    return clampRating((Math.max(0, Math.min(w, x)) / w) * 5);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => onChange(fromX(e.nativeEvent.locationX))}
        onResponderMove={(e) => onChange(fromX(e.nativeEvent.locationX))}
        accessibilityRole="adjustable"
        accessibilityLabel={tr({ en: `Rating ${value.toFixed(1)} of 5`, ko: `평점 5점 만점에 ${value.toFixed(1)}점` })}
        style={{ flexDirection: 'row', gap: STAR_GAP, paddingVertical: 4 }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} pointerEvents="none" style={{ width: size, height: size }}>
            <Star fill={value - (n - 1)} size={size} />
          </View>
        ))}
      </View>
      {/* 현재 평점 좌우 ±0.1 (드래그가 잘 안 될 때 대비) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => onChange(clampRating(value - 0.1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Decrease 0.1', ko: '0.1 낮추기' })}
          style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 17, color: c.text2 }}>−</Text>
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: value > 0 ? c.text : c.text3, minWidth: 30, textAlign: 'center' }}>
          {value.toFixed(1)}
        </Text>
        <Pressable
          onPress={() => onChange(clampRating(value + 0.1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Increase 0.1', ko: '0.1 높이기' })}
          style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 15, color: c.text2 }}>＋</Text>
        </Pressable>
      </View>
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
          accessibilityLabel={tr({ en: `Remove ${name}`, ko: `${name} 삭제` })}
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

// CompanionField — 동행/함께한 사람 공용: 이름 입력 추가 + × 명시 삭제.
export function CompanionField({
  companions,
  onChange,
}: {
  companions: string[];
  onChange: (next: string[]) => void;
}) {
  const { c } = useTheme();
  const [draft, setDraft] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const commit = () => {
    const name = draft.trim();
    if (name) onChange([...companions, name]);
    setDraft('');
    setAdding(false);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
      {companions.map((name, i) => (
        <CompanionChip
          key={`${name}-${i}`}
          name={name}
          onRemove={() => onChange(companions.filter((_, idx) => idx !== i))}
        />
      ))}
      {adding ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 999,
            paddingVertical: 5,
            paddingHorizontal: 13,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.accent,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={tr({ en: 'Name', ko: '이름' })}
            placeholderTextColor={c.text3}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={commit}
            onBlur={commit}
            style={{ fontSize: 13, color: c.text, padding: 0, minWidth: 70 }}
          />
        </View>
      ) : (
        <CompanionChip name={tr({ en: 'Add', ko: '추가' })} dashed onPress={() => setAdding(true)} />
      )}
    </View>
  );
}

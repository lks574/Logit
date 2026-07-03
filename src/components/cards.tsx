import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, withAlpha } from '../theme/tokens';
import { Icon } from './Glyph';
import { Stars } from './Rating';

// ActivityCard — done record. Left 4px color bar + soft-bg icon + title/time +
// meta + rating/memo. Gallery §07 (lines 1815–1825).
export function ActivityCard({
  color,
  soft,
  icon,
  title,
  time,
  meta,
  ratingFilled,
  memo,
  bg,
  onPress,
}: {
  color: string;
  soft: string;
  icon: React.ReactNode;
  title: string;
  time?: string;
  meta?: string;
  ratingFilled?: number;
  memo?: string;
  bg?: string;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, time, meta].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: bg ?? c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius.card,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ width: 4, backgroundColor: color }} />
      <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 11 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{title}</Text>
            {time ? <Text style={{ fontSize: 11, color: c.text3 }}>{time}</Text> : null}
          </View>
          {meta ? (
            <Text numberOfLines={1} style={{ fontSize: 12, color: c.text2, marginTop: 3 }}>
              {meta}
            </Text>
          ) : null}
          {ratingFilled != null || memo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 }}>
              {ratingFilled != null ? <Stars filled={ratingFilled} size={11} /> : null}
              {memo ? (
                <Text numberOfLines={1} style={{ fontSize: 11, color: c.text2, marginLeft: 4, flex: 1 }}>
                  · {memo}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// PlanCard — appointment. Dashed accent border + accent-soft bg + check button.
// Gallery §07 (lines 1826–1833).
export function PlanCard({
  icon,
  iconColor,
  title,
  meta,
  tag,
  onCheck,
  onPress,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  meta?: string;
  tag?: React.ReactNode; // e.g. <Tag>예정</Tag> or <DdayBadge/>
  onCheck?: () => void;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={['약속', title, meta].filter(Boolean).join(', ')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: c.accentSoft,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: withAlpha(c.accent, 45),
        borderRadius: radius.card,
        paddingVertical: 12,
        paddingHorizontal: 13,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: withAlpha(c.accent, 30),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{title}</Text>
          {tag}
        </View>
        {meta ? (
          <Text numberOfLines={1} style={{ fontSize: 12, color: c.text2, marginTop: 3 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onCheck}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${title} 완료 처리`}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          borderWidth: 1.5,
          borderColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon.check size={15} color={c.accent} strokeWidth={2.6} />
      </Pressable>
    </Pressable>
  );
}

// StatCard — N-cell metric block, 1px dividers between cells. Gallery §07.
export function StatCard({
  cells,
  bg,
  style,
}: {
  cells: { value: string; label: string; valueColor?: string; unit?: string }[];
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: bg ?? c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: radius.card,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {cells.map((cell, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            paddingVertical: 11,
            paddingHorizontal: 6,
            alignItems: 'center',
            borderRightWidth: i < cells.length - 1 ? 1 : 0,
            borderRightColor: c.border,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: cell.valueColor ?? c.text, letterSpacing: -0.4 }}>
            {cell.value}
            {cell.unit ? <Text style={{ fontSize: 11, fontWeight: '600' }}>{cell.unit}</Text> : null}
          </Text>
          <Text style={{ fontSize: 11, color: c.text2, marginTop: 1 }}>{cell.label}</Text>
        </View>
      ))}
    </View>
  );
}

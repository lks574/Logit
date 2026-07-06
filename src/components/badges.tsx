import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/tokens';
import { tr } from '../i18n/i18n';

export type SyncState = 'synced' | 'pending' | 'offline';

// SyncStatusBadge — 3 states, color dot + label (never color alone). Gallery §07.
export function SyncStatusBadge({ state }: { state: SyncState }) {
  const { c } = useTheme();
  const map = {
    synced: { dot: c.success, label: tr({ en: 'Synced', ko: '동기화됨' }), text: c.text2 },
    pending: { dot: c.warning, label: tr({ en: 'Pending', ko: '대기 중' }), text: c.text2 },
    offline: { dot: c.text3, label: tr({ en: 'Offline', ko: '오프라인' }), text: c.text3 },
  }[state];
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
        paddingVertical: 5,
        paddingLeft: 8,
        paddingRight: 10,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: map.dot }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: map.text }}>{map.label}</Text>
    </View>
  );
}

// DdayBadge — D-DAY (filled accent) / D-n (color-tinted outline). Gallery §07.
export function DdayBadge({ days, color }: { days: number; color?: string }) {
  const { c } = useTheme();
  const isDday = days <= 0;
  if (isDday) {
    return (
      <View style={{ backgroundColor: c.accent, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>D-DAY</Text>
      </View>
    );
  }
  const tint = color ?? c.accent;
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: withAlpha(tint, 25),
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color: tint }}>D-{days}</Text>
    </View>
  );
}

// Tag — small colored pill (예정 / 유산소 / 근력 …). Gallery §07.
export function Tag({
  label,
  color,
  soft,
  outline,
}: {
  label: string;
  color: string;
  soft?: string;
  outline?: boolean;
}) {
  const { c } = useTheme();
  if (outline) {
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: withAlpha(color, 35),
          borderRadius: 5,
          paddingVertical: 2,
          paddingHorizontal: 7,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: soft ?? withAlpha(color, 14), borderRadius: 7, paddingVertical: 4, paddingHorizontal: 9 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

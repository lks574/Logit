import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Screen, T, Divider } from '../../components/primitives';
import { Icon } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';
import { tr } from '../../i18n/i18n';
import { radius } from '../../theme/tokens';
import { DEV_STATUS, DevItem } from '../../data/roadmap';

// 개발 현황 — "정상 운영 중" + 주요 업데이트를 큰 건 단위로 진행률(%)·예상 시점과 함께 표시.
// 데이터는 src/data/roadmap.ts.
export default function RoadmapScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const version = Constants.expoConfig?.version ?? '?';
  const { operational, updatedAt, items } = DEV_STATUS;

  const Item = ({ item }: { item: DevItem }) => {
    const pct = Math.max(0, Math.min(100, Math.round(item.progress)));
    const done = pct >= 100;
    return (
      <View style={{ padding: 14, gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text }}>{tr(item.title)}</T>
          <T style={{ fontSize: 13, fontWeight: '700', color: done ? c.success : c.accent }}>{pct}%</T>
        </View>
        {/* 진행률 바 */}
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: done ? c.success : c.accent }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon.calendar size={13} color={c.text3} strokeWidth={1.8} />
          <T style={{ fontSize: 12, color: c.text3 }}>
            {done
              ? tr({ en: 'Released', ko: '배포 완료' })
              : `${tr({ en: 'Expected', ko: '예상' })} · ${tr(item.eta)}`}
          </T>
        </View>
      </View>
    );
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header: 뒤로 / 제목 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 }}>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr({ en: 'Back', ko: '뒤로' })}
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <T style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{tr({ en: 'App status', ko: '개발 현황' })}</T>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 22 }}>
        {/* 상태 히어로 — "정상 운영 중" */}
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: operational ? c.success : c.warning, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.check size={34} color="#fff" strokeWidth={2.6} />
          </View>
          <T style={{ fontSize: 20, fontWeight: '700', color: c.text }}>
            {operational ? tr({ en: 'Up and running', ko: '정상 운영 중' }) : tr({ en: 'Under maintenance', ko: '점검 중' })}
          </T>
          <T style={{ fontSize: 13, color: c.text2 }}>
            {tr({ en: `Last updated ${updatedAt} · v${version}`, ko: `마지막 업데이트 ${updatedAt} · v${version}` })}
          </T>
        </View>

        {/* 주요 업데이트 (큰 건 · 진행률 · 예상 시점) */}
        <View>
          <T style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginHorizontal: 4, marginBottom: 8 }}>
            {tr({ en: 'Major updates', ko: '주요 업데이트' })}
          </T>
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.card, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <Item item={item} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

import { useNavigation } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fab } from '../components/Button';
import { Icon, IconName } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { tr, Msg } from '../i18n/i18n';

// BottomTabBar — 홈 · 캘린더 · [＋추가 FAB] · 통계 · 설정. Center FAB (accent,
// 46/r16, floats -14) opens AddChooser. HTML lines 167–176.
const TABS: { key: string; label: Msg; icon: IconName }[] = [
  { key: 'Home', label: { en: 'Home', ko: '홈' }, icon: 'home' },
  { key: 'Calendar', label: { en: 'Calendar', ko: '캘린더' }, icon: 'calendar' },
  { key: 'Stats', label: { en: 'Stats', ko: '통계' }, icon: 'chart' },
  { key: 'Settings', label: { en: 'Settings', ko: '설정' }, icon: 'settings' },
];

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const root = useNavigation<any>();
  const activeKey = state.routes[state.index].name;

  const item = (t: (typeof TABS)[number]) => {
    const active = activeKey === t.key;
    const IconCmp = Icon[t.icon];
    const label = tr(t.label);
    return (
      <Pressable
        key={t.key}
        onPress={() => navigation.navigate(t.key)}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        style={{ flex: 1, alignItems: 'center', gap: 3, minWidth: 40 }}
      >
        <IconCmp size={22} color={active ? c.accent : c.text3} />
        <Text style={{ fontSize: 10, fontWeight: active ? '600' : '500', color: active ? c.accent : c.text3 }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: c.surface,
        paddingTop: 9,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 6),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {item(TABS[0])}
        {item(TABS[1])}
        <View style={{ flex: 0, alignItems: 'center', gap: 3, minWidth: 50 }}>
          <Fab onPress={() => root.navigate('AddChooser')} label={tr({ en: 'Add', ko: '추가' })}>
            <Icon.plus size={24} color="#fff" strokeWidth={2.4} />
          </Fab>
          <Text style={{ fontSize: 10, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Add', ko: '추가' })}</Text>
        </View>
        {item(TABS[2])}
        {item(TABS[3])}
      </View>
    </View>
  );
}

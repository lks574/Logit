import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { Icon, Glyph, Path, Circle, Rect } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';

// FAB(추가) → 무엇을 추가할지 선택. 기록(한 일) / 약속(예정). 전역 진입점.
export default function AddChooserScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();

  const Option = ({
    icon,
    title,
    subtitle,
    color,
    soft,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    soft: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        padding: 16,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{title}</Text>
        <Text style={{ fontSize: 12.5, color: c.text2, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Icon.chevronRight size={18} color={c.text3} />
    </Pressable>
  );

  return (
    <Screen edges={['top', 'bottom']} scroll={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: c.text }}>무엇을 추가할까요?</Text>
        <Pressable
          onPress={() => nav.goBack()}
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon.close size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 12 }}>
        <Option
          title="기록"
          subtitle="오늘 한 운동·공연을 남깁니다"
          color={c.accent}
          soft={c.accentSoft}
          icon={
            <Glyph size={24} color={c.accent} strokeWidth={2}>
              <Path d="M4 19 L9 12 L13 15 L20 5" />
            </Glyph>
          }
          onPress={() => nav.replace('ActivitySelect')}
        />
        <Option
          title="약속"
          subtitle="앞으로의 예정을 잡아둡니다"
          color={c.accent}
          soft={c.accentSoft}
          icon={
            <Glyph size={22} color={c.accent} strokeWidth={2}>
              <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
              <Path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 14l2 2 4-4" />
            </Glyph>
          }
          onPress={() => nav.replace('AddPlan')}
        />
      </View>
    </Screen>
  );
}

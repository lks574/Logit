import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { IconButton } from './Button';
import { Icon } from './Glyph';

// ScreenHeader — 뒤로 + 중앙 타이틀 + 우측 액션 슬롯.
// 타이틀은 position:absolute로 좌우 버튼 폭과 무관하게 항상 중앙 고정
// (space-between만 쓰면 우측 버튼이 많을수록 타이틀이 한쪽으로 밀린다).
export function ScreenHeader({
  title,
  onBack,
  right,
  style,
}: {
  title: string;
  onBack?: (() => void) | null; // null이면 back 버튼 숨김
  right?: React.ReactNode; // 우측 액션(IconButton/pill 등)
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const back = onBack === null ? undefined : onBack ?? (() => nav.goBack());
  return (
    <View style={[{ height: 44, justifyContent: 'center', paddingHorizontal: 16 }, style]}>
      <Text
        numberOfLines={1}
        style={{ position: 'absolute', left: 56, right: 56, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.text }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {back ? (
          <IconButton size={30} bg={c.surfaceAlt} label="뒤로" onPress={back}>
            <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
          </IconButton>
        ) : (
          <View style={{ width: 30 }} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View>
      </View>
    </View>
  );
}

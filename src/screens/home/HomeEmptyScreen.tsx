import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { Glyph, Icon, Path } from '../../components/Glyph';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeEmptyScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();

  return (
    <Screen edges={['top']} scroll={false}>
      {/* Date + title */}
      <View style={{ paddingTop: 8, paddingHorizontal: 18 }}>
        <Text style={{ fontSize: 13, color: c.text2, fontWeight: '500' }}>6월 30일 월요일</Text>
        <Text style={{ fontSize: 25, fontWeight: '700', letterSpacing: -0.75, color: c.text, marginTop: 2 }}>
          기록
        </Text>
      </View>

      {/* Centered empty state */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 34,
          gap: 18,
        }}
      >
        {/* 104px logo tile with accent line-chart mark + plus badge */}
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 30,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph size={46} color={c.accent} strokeWidth={1.6}>
            <Path d="M4 19 L9 12 L13 15 L20 5" />
          </Glyph>
          <View
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: c.accent,
              shadowOpacity: 0.6,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            }}
          >
            <Icon.plus size={18} color="#fff" strokeWidth={2.6} />
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, letterSpacing: -0.38, textAlign: 'center' }}>
            첫 기록을 남겨보세요
          </Text>
          <Text style={{ fontSize: 14, color: c.text2, lineHeight: 22, marginTop: 8, textAlign: 'center' }}>
            오늘의 런닝, 어제 본 공연,{'\n'}방금 끝낸 운동까지.{'\n'}하나씩 쌓이면 돌아볼 기록이 됩니다.
          </Text>
        </View>

        <Button
          label="기록 추가"
          variant="primary"
          icon={<Icon.plus size={18} color="#fff" strokeWidth={2.4} />}
          onPress={() => nav.navigate('ActivitySelect')}
          style={{
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 22,
            shadowColor: c.accent,
            shadowOpacity: 0.6,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        />

        <Pressable onPress={() => {}} hitSlop={8}>
          <Text
            style={{
              color: c.text3,
              fontSize: 13,
              fontWeight: '500',
              textDecorationLine: 'underline',
            }}
          >
            예시로 둘러보기
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

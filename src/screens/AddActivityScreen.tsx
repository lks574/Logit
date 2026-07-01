import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { Icon, Glyph, Path, Circle } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { templateColor, TemplateType, Palette } from '../theme/tokens';

type TemplateDef = {
  id: TemplateType;
  name: string;
  example: string;
  icon: (typeof Icon)[keyof typeof Icon];
};

// The 5 record templates (6.1 활동 직접 추가). name / example sports / icon per prompt.
const TEMPLATES: TemplateDef[] = [
  { id: 'endurance', name: '거리·시간형', example: '거리 · 시간 · 페이스', icon: Icon.running },
  { id: 'setrep', name: '세트·횟수형', example: '종목 · 세트 · 반복 · 난이도', icon: Icon.dumbbell },
  { id: 'match', name: '대전·경기형', example: '상대 · 스코어 · 승패', icon: Icon.soccer },
  { id: 'spectate', name: '관람·공연형', example: '장소 · 좌석 · 평점', icon: Icon.performance },
  { id: 'free', name: '자유 기록형', example: '제목 · 메모 · 사진', icon: Icon.yoga },
];

// color swatch options — same order/colors as the HTML swatch row.
const COLOR_KEYS: (keyof Palette)[] = ['strength', 'cardio', 'team', 'perf', 'accent', 'star'];

export default function AddActivityScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();

  const [name, setName] = React.useState('');
  const [selected, setSelected] = React.useState<TemplateType>('setrep');
  const [colorKey, setColorKey] = React.useState<keyof Palette>('strength');

  const onCancel = () => nav.goBack();
  const onSave = () => nav.navigate('MainTabs');

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Header: 취소 / 활동 추가 / 저장 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon.chevronLeft size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>활동 추가</Text>
        <Pressable
          onPress={onSave}
          hitSlop={8}
          style={{
            height: 30,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: c.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>저장</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 2, gap: 16, paddingBottom: 24 }}>
        {/* 활동 이름 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>활동 이름</Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1.5,
              borderColor: c.accent,
              borderRadius: 13,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="클라이밍"
              placeholderTextColor={c.text}
              style={{ fontSize: 19, fontWeight: '700', color: c.text, padding: 0 }}
            />
          </View>
        </View>

        {/* 기록 템플릿 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>기록 템플릿</Text>
          {TEMPLATES.map((t) => {
            const keys = templateColor[t.id];
            const tColor = c[keys.color];
            const tSoft = c[keys.soft];
            const isSel = selected === t.id;
            const IconCmp = t.icon;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  setSelected(t.id);
                  setColorKey(keys.color);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  backgroundColor: isSel ? tSoft : c.surface,
                  borderWidth: isSel ? 1.5 : 1,
                  borderColor: isSel ? tColor : c.border,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 13,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: isSel ? c.surface : tSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconCmp size={17} color={tColor} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? '700' : '600',
                      color: isSel ? c.text : c.text2,
                    }}
                  >
                    {t.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.text2, marginTop: 1 }}>{t.example}</Text>
                </View>
                {isSel ? (
                  <Glyph size={18} color={tColor} strokeWidth={2.6}>
                    <Path d="M5 12.5l4.5 4.5L19 6" />
                  </Glyph>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* 색상 · 아이콘 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>색상 · 아이콘</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {COLOR_KEYS.map((k) => {
              const isSel = colorKey === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setColorKey(k)}
                  hitSlop={6}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: c[k],
                    borderWidth: isSel ? 2 : 0,
                    borderColor: c.surface,
                    // ring around the selected swatch (box-shadow 0 0 0 2px)
                    ...(isSel
                      ? {
                          shadowColor: c[k],
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 2,
                        }
                      : {}),
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            backgroundColor: c.accentSoft,
            borderRadius: 12,
            paddingVertical: 13,
            paddingHorizontal: 14,
            marginTop: 2,
          }}
        >
          <View style={{ marginTop: 1, flexShrink: 0 }}>
            <Glyph size={16} color={c.accent} strokeWidth={2}>
              <Circle cx="12" cy="12" r="9" />
              <Path d="M12 8h.01M11 12h1v4h1" />
            </Glyph>
          </View>
          <Text style={{ fontSize: 12.5, color: c.text, lineHeight: 19, flex: 1 }}>
            템플릿만 고르면 즉시 반영, 앱 업데이트 불필요.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

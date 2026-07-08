import React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, Glyph, Path, Circle } from '../../components/Glyph';
import { activities } from '../../data/activities';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { templateColor, TemplateType } from '../../theme/tokens';
import { Msg, tr } from '../../i18n/i18n';

type TemplateDef = {
  id: TemplateType;
  name: Msg;
  example: Msg;
  icon: (typeof Icon)[keyof typeof Icon];
};

// The 5 record templates (6.1 활동 직접 추가). name / example sports / icon per prompt.
const TEMPLATES: TemplateDef[] = [
  { id: 'endurance', name: { en: 'Distance · Time', ko: '거리·시간형' }, example: { en: 'Distance · Time · Speed', ko: '거리 · 시간 · 속도' }, icon: Icon.running },
  { id: 'setrep', name: { en: 'Sets · Reps', ko: '세트·횟수형' }, example: { en: 'Exercise · Sets · Reps · Level', ko: '종목 · 세트 · 반복 · 난이도' }, icon: Icon.dumbbell },
  { id: 'match', name: { en: 'Match', ko: '대전·경기형' }, example: { en: 'Opponent · Score · Result', ko: '상대 · 스코어 · 승패' }, icon: Icon.soccer },
  { id: 'spectate', name: { en: 'Performance', ko: '관람·공연형' }, example: { en: 'Venue · Seat · Rating', ko: '장소 · 좌석 · 평점' }, icon: Icon.performance },
  { id: 'outing', name: { en: 'Leisure & outings', ko: '여가·나들이' }, example: { en: 'Place · Companions · Rating', ko: '장소 · 동행 · 평점' }, icon: Icon.tent },
  { id: 'free', name: { en: 'Free record', ko: '자유 기록형' }, example: { en: 'Title · Memo · Photo', ko: '제목 · 메모 · 사진' }, icon: Icon.yoga },
];

export default function AddActivityScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addActivity, customActivities } = useStore();

  const [name, setName] = React.useState('');
  const [selected, setSelected] = React.useState<TemplateType>('setrep');

  const onCancel = () => nav.goBack();
  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return; // skip when name empty
    // 중복이면 저장된 척 이동하지 않고 알린다(빌트인·커스텀 모두 검사).
    if (activities[trimmed] || customActivities.some((a) => a.name === trimmed)) {
      Alert.alert(tr({ en: 'Activity exists', ko: '이미 있는 활동' }), tr({ en: 'An activity with the same name already exists.', ko: '같은 이름의 활동이 이미 있어요.' }));
      return;
    }
    addActivity({ name: trimmed, template: selected });
    nav.navigate('MainTabs');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Header: 뒤로 / 활동 추가 / 저장 */}
      <ScreenHeader
        title={tr({ en: 'Add activity', ko: '활동 추가' })}
        onBack={onCancel}
        style={{ paddingTop: 6 }}
        right={
          <Pressable
            onPress={onSave}
            hitSlop={8}
            style={{ height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'Save', ko: '저장' })}</Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 16, paddingTop: 2, gap: 16, paddingBottom: 24 }}>
        {/* 활동 이름 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Activity name', ko: '활동 이름' })}</Text>
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
              placeholder={tr({ en: 'Climbing', ko: '클라이밍' })}
              placeholderTextColor={c.text}
              style={{ fontSize: 19, fontWeight: '700', color: c.text, padding: 0 }}
            />
          </View>
        </View>

        {/* 기록 템플릿 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Record template', ko: '기록 템플릿' })}</Text>
          {TEMPLATES.map((t) => {
            const keys = templateColor[t.id];
            const tColor = c[keys.color];
            const tSoft = c[keys.soft];
            const isSel = selected === t.id;
            const IconCmp = t.icon;
            return (
              <Pressable
                key={t.id}
                onPress={() => setSelected(t.id)}
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
                    {tr(t.name)}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.text2, marginTop: 1 }}>{tr(t.example)}</Text>
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
            {tr({ en: 'Just pick a template — applied instantly, no app update needed.', ko: '템플릿만 고르면 즉시 반영, 앱 업데이트 불필요.' })}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

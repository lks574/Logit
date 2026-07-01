import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/primitives';
import { Toggle } from '../components/controls';
import { Icon, Glyph, Path, Circle, Rect } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/StoreContext';
import { TemplateType } from '../theme/tokens';

type ActKey = 'strength' | 'cardio' | 'team';

// Map each activity chip to its stored activity name + record template.
const CHIP_META: Record<ActKey, { activity: string; template: TemplateType }> = {
  strength: { activity: '헬스', template: 'setrep' },
  cardio: { activity: '런닝', template: 'endurance' },
  team: { activity: '축구', template: 'match' },
};

// Activity chip choices copied 1:1 from Logit.dc.html §5.3 (lines 1451–1456).
const ACTIVITIES: {
  key: ActKey;
  label: string;
  color: (c: any) => string;
  soft: (c: any) => string;
  icon: (color: string) => React.ReactNode;
}[] = [
  {
    key: 'strength',
    label: '헬스',
    color: (c) => c.strength,
    soft: (c) => c.strengthSoft,
    icon: (color) => (
      <Glyph size={17} color={color}>
        <Path d="M6.5 6.5l11 11M4 8l-2 2 4 4M16 4l4 4-2 2M8 16l-4-4M16 8l4 4" />
      </Glyph>
    ),
  },
  {
    key: 'cardio',
    label: '런닝',
    color: (c) => c.cardio,
    soft: (c) => c.cardioSoft,
    icon: (color) => (
      <Glyph size={17} color={color}>
        <Circle cx="16" cy="4.5" r="2" />
        <Path d="M10 9l3-1.5 3 2 2 1.5M13 7.5l-1 5 3 2.5 1 4M12 12.5l-3.5 1.5L6 19" />
      </Glyph>
    ),
  },
  {
    key: 'team',
    label: '축구',
    color: (c) => c.team,
    soft: (c) => c.teamSoft,
    icon: (color) => (
      <Glyph size={17} color={color}>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z" />
      </Glyph>
    ),
  },
];

export default function AddPlanScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addPlan } = useStore();
  const [selected, setSelected] = React.useState<ActKey>('strength');
  const [alarm, setAlarm] = React.useState(true);
  const [memo, setMemo] = React.useState('');

  const onSave = () => {
    const { activity, template } = CHIP_META[selected];
    addPlan({
      activity,
      template,
      // Form date field is the static sample "7월 2일 (수)" → 2026-07-02.
      dateISO: '2026-07-02',
      timeLabel: '오후 3:00',
      place: '잠실 보조경기장',
      memo: memo.trim() || undefined,
      reminder: alarm,
    });
    nav.goBack();
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{children}</Text>
  );

  return (
    <Screen edges={['top', 'bottom']} scroll={false}>
      {/* Modal header: close ✕(chevron) / title / 저장 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 6,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
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
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>약속 추가</Text>
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

      {/* Form body */}
      <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 2, gap: 16 }}>
        {/* 활동 chips */}
        <View style={{ gap: 8 }}>
          <SectionLabel>활동</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ACTIVITIES.map((a) => {
              const active = selected === a.key;
              const color = a.color(c);
              const soft = a.soft(c);
              return (
                <Pressable
                  key={a.key}
                  onPress={() => setSelected(a.key)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 13,
                    paddingVertical: 11,
                    paddingHorizontal: 6,
                    backgroundColor: active ? soft : c.surface,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? color : c.border,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      backgroundColor: active ? c.surface : soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {a.icon(color)}
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? c.text : c.text2 }}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
            {/* overflow (…) */}
            <Pressable
              hitSlop={4}
              style={{
                width: 46,
                borderRadius: 13,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph size={18} color={c.text3}>
                <Circle cx="5" cy="12" r="1.6" />
                <Circle cx="12" cy="12" r="1.6" />
                <Circle cx="19" cy="12" r="1.6" />
              </Glyph>
            </Pressable>
          </View>
        </View>

        {/* 날짜 · 시간 */}
        <View style={{ gap: 8 }}>
          <SectionLabel>날짜 · 시간</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                flex: 1.4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Glyph size={17} color={c.accent}>
                <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
              </Glyph>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>7월 2일 (수)</Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Glyph size={17} color={c.accent}>
                <Circle cx="12" cy="12" r="9" />
                <Path d="M12 7v5l3.5 2" />
              </Glyph>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>오후 3:00</Text>
            </View>
          </View>
        </View>

        {/* 장소 */}
        <View style={{ gap: 8 }}>
          <SectionLabel>장소</SectionLabel>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 13,
            }}
          >
            <Glyph size={17} color={c.text3}>
              <Path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
              <Circle cx="12" cy="10" r="2.5" />
            </Glyph>
            <Text style={{ fontSize: 14, color: c.text }}>잠실 보조경기장</Text>
          </View>
        </View>

        {/* 메모 · 선택 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>
            메모 <Text style={{ color: c.text3, fontWeight: '500' }}>· 선택</Text>
          </Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 13,
              minHeight: 52,
            }}
          >
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="풋살화 챙기기, 물 2병"
              placeholderTextColor={c.text3}
              multiline
              style={{ fontSize: 13.5, color: c.text, padding: 0, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {/* 알림 Toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Glyph size={17} color={c.text2}>
              <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.5 21a1.7 1.7 0 0 1-3 0" />
            </Glyph>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>알림</Text>
              <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>1시간 전</Text>
            </View>
          </View>
          <Toggle value={alarm} onChange={setAlarm} />
        </View>
      </View>

      {/* Primary 약속 저장 */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 }}>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: c.accent,
            borderRadius: 14,
            paddingVertical: 15,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Glyph size={18} color="#fff" strokeWidth={2.4}>
            <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
            <Path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 14l2 2 4-4" />
          </Glyph>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>약속 저장</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

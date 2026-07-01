import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton, Field } from '../../components/Field';
import { Segmented } from '../../components/controls';
import { RatingInput } from '../../components/Rating';
import { Glyph, Icon, Path } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';

// FreeForm — 자유 기록형 catch-all (free template, accent color #3D5A80).
// Derived from the common skeleton (§02, HTML lines 296–437):
//   필수 = 날짜·시간 row · core = 시간(duration) + 강도(segmented) + 평점(RatingInput)
//   · 공통 세부 입력 disclosure · 메모 field · offline footer note.

type Intensity = 'low' | 'mid' | 'high';

export default function FreeForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [intensity, setIntensity] = React.useState<Intensity>('mid');
  const [rating, setRating] = React.useState(4);
  const [memo, setMemo] = React.useState('');

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<Icon.yoga size={13} color={c.accent} strokeWidth={2.2} />}
        color={c.accent}
        soft={c.accentSoft}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 필수 — 날짜 · 시간 */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>
            필수
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Glyph size={18} color={c.text2} strokeWidth={1.8}>
                <Path d="M3 4.5h18v16H3z" />
                <Path d="M3 9h18M8 2.5v4M16 2.5v4" />
              </Glyph>
              <Text style={{ fontSize: 14, color: c.text }}>날짜 · 시간</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>오늘 · 오후 6:30</Text>
          </View>
        </View>

        {/* core — 시간 (duration) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>시간</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 4,
              backgroundColor: c.surfaceAlt,
              borderRadius: 10,
              paddingVertical: 11,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>45</Text>
            <Text style={{ fontSize: 13, color: c.text2 }}>분</Text>
          </View>
        </View>

        {/* core — 강도 (segmented) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>강도</Text>
          <Segmented<Intensity>
            options={[
              { key: 'low', label: '낮음' },
              { key: 'mid', label: '보통' },
              { key: 'high', label: '높음' },
            ]}
            value={intensity}
            onChange={setIntensity}
            color={c.accent}
          />
        </View>

        {/* core — 평점 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>평점</Text>
          <RatingInput value={rating} onChange={setRating} size={22} />
        </View>

        {/* 공통 세부 입력 (collapsed default) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모"
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />

        {/* 메모 */}
        <Field label="메모" value={memo} onChangeText={setMemo} placeholder="자유롭게 기록해보세요" />

        {/* offline footer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            marginTop: 6,
          }}
        >
          <Icon.check size={14} color={c.text3} strokeWidth={2} />
          <Text style={{ fontSize: 12, color: c.text3 }}>오프라인에서도 즉시 저장됩니다</Text>
        </View>
      </View>
    </Screen>
  );
}

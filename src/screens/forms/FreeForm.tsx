import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton, Field } from '../../components/Field';
import { Segmented } from '../../components/controls';
import { RatingInput } from '../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';

// FreeForm — 자유 기록형 catch-all (free template, accent color #3D5A80).
// Derived from the common skeleton (§02, HTML lines 296–437):
//   필수 = 날짜·시간 row · core = 시간(duration) + 강도(segmented) + 평점(RatingInput)
//   · 공통 세부 입력 disclosure · 메모 field · offline footer note.

type Intensity = 'low' | 'mid' | 'high';

const INTENSITY_LABEL: Record<Intensity, string> = { low: '낮음', mid: '보통', high: '높음' };

export default function FreeForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, today } = useStore();
  const [open, setOpen] = React.useState(false);
  const [intensity, setIntensity] = React.useState<Intensity>('mid');
  const [rating, setRating] = React.useState(4);
  const [memo, setMemo] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([]);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const handleSave = () => {
    const 시간 = '45분';
    const 강도 = INTENSITY_LABEL[intensity];
    addRecord({
      activity,
      template: 'free',
      dateISO: today,
      timeLabel: '방금',
      rating,
      memo,
      photos,
      meta: `${시간} · 강도 ${강도}`,
      fields: { 시간, 강도 },
    });
    nav.navigate('MainTabs');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<Icon.yoga size={13} color={c.accent} strokeWidth={2.2} />}
        color={c.accent}
        soft={c.accentSoft}
        onSave={handleSave}
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

        {/* Expanded — 사진 */}
        {open ? (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>사진</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 11 }} />
              ))}
              <Pressable
                onPress={pickPhoto}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 11,
                  backgroundColor: c.surfaceAlt,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph size={20} color={c.text3} strokeWidth={2}>
                  <Rect x="3" y="5" width="18" height="15" rx="3" />
                  <Path d="M3 16l5-4 4 3 3-2 6 4" />
                  <Path d="M9 10 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0" />
                </Glyph>
              </Pressable>
            </View>
          </View>
        ) : null}

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

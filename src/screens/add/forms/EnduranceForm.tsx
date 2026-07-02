import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { CompanionChip, RatingInput } from '../../../components/Rating';
import { DisclosureButton } from '../../../components/Field';
import { FormHeader } from '../../../components/FormHeader';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { Screen } from '../../../components/primitives';
import { activities, colorsFor } from '../../../data/activities';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { withAlpha } from '../../../theme/tokens';

// §03 3.1 거리·시간형 — EnduranceForm (cardio). Embeds §02 common skeleton.
// HTML source of truth: Logit.dc.html 2.1 (296–358), 2.2 (359–437), 3.1 (444–502).

// 기분 4단계 — 얼굴 path + 저장 라벨(fields.기분).
const MOODS = [
  { d: 'M8.5 15.5c1-1.4 6-1.4 7 0M9 9.5h.01M15 9.5h.01', label: '별로' },
  { d: 'M8.5 14h7M9 9.5h.01M15 9.5h.01', label: '보통' },
  { d: 'M8.5 13.5c1 1.4 6 1.4 7 0M9 9.5h.01M15 9.5h.01', label: '좋음' },
  { d: 'M8 13c1.2 2 6.8 2 8 0M9 9.5h.01M15 9.5h.01', label: '최고' },
];

export default function EnduranceForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, today } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [open, setOpen] = React.useState(editing); // 세부 입력 disclosure (open when editing)
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const [place, setPlace] = React.useState(record?.fields?.장소 ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [mood, setMood] = React.useState<number>(() => MOODS.findIndex((m) => m.label === record?.fields?.기분));

  // Endurance core fields (prefilled from record.fields when editing, blank on create)
  const [거리, set거리] = React.useState(record?.fields?.거리 ?? '');
  const [시간, set시간] = React.useState(record?.fields?.시간 ?? '');
  const [페이스, set페이스] = React.useState(record?.fields?.페이스 ?? '');
  const [고도, set고도] = React.useState(record?.fields?.고도 ?? '');
  const [칼로리, set칼로리] = React.useState(record?.fields?.칼로리 ?? '');
  const [평균심박, set평균심박] = React.useState(record?.fields?.평균심박 ?? '');

  const template = activities[activity]?.template ?? 'endurance';
  const { color, soft } = colorsFor(template, c);
  const ActIcon = Icon.running;

  const pickPhoto = async () => {
    const uri = await choosePhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const addCompanion = () => {
    setCompanions((prev) => [...prev, `동행 ${prev.length + 1}`]);
  };

  const handleSave = () => {
    if (거리.trim() === '' && 시간.trim() === '') {
      Alert.alert('필수 항목', '거리 또는 시간을 입력해 주세요.');
      return;
    }
    // Build fields with only non-empty values so blank inputs are omitted.
    const fieldEntries: [string, string][] = [
      ['거리', 거리],
      ['시간', 시간],
      ['페이스', 페이스],
      ['고도', 고도],
      ['칼로리', 칼로리],
      ['평균심박', 평균심박],
      ['장소', place],
      ['기분', mood >= 0 ? MOODS[mood].label : ''],
    ];
    const fields = Object.fromEntries(fieldEntries.filter(([, v]) => v !== ''));

    // 거리 stored verbatim (with its unit, e.g. "5.2km") like 고도/칼로리 — avoids
    // double-unit on edit round-trip. Join only non-empty parts.
    const meta = [place, 거리, 시간].filter(Boolean).join(' · ');

    const payload = {
      activity,
      template: 'endurance' as const,
      dateISO: editing ? record!.dateISO : today,
      timeLabel: editing ? record!.timeLabel : '방금',
      meta,
      rating,
      memo,
      companions,
      photos,
      fields,
    };
    if (editing) {
      updateRecord(recordId!, payload);
      nav.goBack();
    } else {
      addRecord(payload);
      nav.navigate('MainTabs');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<ActIcon size={13} color={color} strokeWidth={2.2} />}
        color={color}
        soft={soft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, paddingTop: 14, gap: 14 }}>
        {/* Prefill button (2.1) — accent-soft, refresh icon */}
        <Pressable
          onPress={() => {}}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            backgroundColor: c.accentSoft,
            borderWidth: 1,
            borderColor: withAlpha(c.accent, 22),
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <Icon.refresh size={17} color={c.accent} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: c.accent }}>
            어제 {activity} 불러와서 수정
          </Text>
          <Icon.chevronRight size={16} color={c.accent} strokeWidth={2} />
        </Pressable>

        {/* HealthKit / Health Connect — disabled placeholder (3.1) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: c.border,
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: c.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph size={17} color={c.text2} strokeWidth={1.8}>
              <Path d="M19 14c-1.5 1.6-3.6 3.3-7 6-3.4-2.7-5.5-4.4-7-6-2.5-2.7-2-6 1-7 1.8-.6 3.6 0 4.6 1.2.6.7.7.9 1.4.9s.8-.2 1.4-.9C15.4 7 17.2 6.4 19 7c3 1 3.5 4.3 1 7z" />
            </Glyph>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>건강 앱에서 불러오기</Text>
            <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>
              HealthKit · Health Connect · 후속 지원
            </Text>
          </View>
          <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: c.text3 }}>준비 중</Text>
          </View>
        </View>

        {/* 핵심 수치 · 필수 — 거리 / 시간 (3.1) */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: c.text3,
              letterSpacing: 0.44,
              marginBottom: 7,
            }}
          >
            핵심 수치 · 필수
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderWidth: 1.5,
                borderColor: color,
                borderRadius: 13,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: c.text2 }}>거리</Text>
              <TextInput
                value={거리}
                onChangeText={set거리}
                placeholder="예: 5.2km"
                placeholderTextColor={c.text3}
                style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 4, padding: 0 }}
              />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 13,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: c.text2 }}>시간</Text>
              <TextInput
                value={시간}
                onChangeText={set시간}
                placeholder="예: 27:12"
                placeholderTextColor={c.text3}
                style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 4, padding: 0 }}
              />
            </View>
          </View>
        </View>

        {/* 상세 수치 — 평균 페이스(자동)/고도/칼로리/평균 심박 (3.1) */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: c.text3,
              letterSpacing: 0.44,
              marginBottom: 7,
            }}
          >
            상세 수치
          </Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 13,
              overflow: 'hidden',
            }}
          >
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>평균 페이스</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <TextInput
                  value={페이스}
                  onChangeText={set페이스}
                  placeholder="자동"
                  placeholderTextColor={c.text3}
                  style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 80 }}
                />
                <View style={{ backgroundColor: soft, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color }}>자동</Text>
                </View>
              </View>
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>고도 상승</Text>
              <TextInput
                value={고도}
                onChangeText={set고도}
                placeholder="예: 42m"
                placeholderTextColor={c.text3}
                style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 80 }}
              />
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>칼로리</Text>
              <TextInput
                value={칼로리}
                onChangeText={set칼로리}
                placeholder="예: 328kcal"
                placeholderTextColor={c.text3}
                style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 80 }}
              />
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Glyph size={16} color={c.error} strokeWidth={2}>
                  <Path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8-1c-2.2 2.2-2 5.6.4 8L12 21l8.4-7.4c2.4-2.4 2.6-5.8.4-8z" />
                </Glyph>
                <Text style={{ fontSize: 14, color: c.text }}>평균 심박</Text>
              </View>
              <TextInput
                value={평균심박}
                onChangeText={set평균심박}
                placeholder="예: 152bpm"
                placeholderTextColor={c.text3}
                style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 80 }}
              />
            </DetailRow>
          </View>
        </View>

        {/* 세부 입력 disclosure — collapsed by default (2.1) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용"
          open={open}
          onPress={() => setOpen((v) => !v)}
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
        />

        {/* Expanded detail fields (2.2) */}
        {open ? (
          <View style={{ gap: 15 }}>
            {/* 장소 */}
            <View>
              <Text style={styleLabel(c)}>장소</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                }}
              >
                <Glyph size={16} color={c.text3} strokeWidth={2}>
                  <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                  <Path d="M12 10 m -2.6 0 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0" />
                </Glyph>
                <TextInput
                  value={place}
                  onChangeText={setPlace}
                  placeholder="장소"
                  placeholderTextColor={c.text3}
                  style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                {['최근 · 올림픽공원', '양재천'].map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setPlace(t.replace('최근 · ', ''))}
                    style={{
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 7,
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.text2 }}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 동행 */}
            <View>
              <Text style={styleLabel(c)}>동행</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {companions.map((name, i) => (
                  <Pressable
                    key={`${name}-${i}`}
                    onPress={() => setCompanions((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: c.accent,
                      borderRadius: 999,
                      paddingVertical: 7,
                      paddingLeft: 8,
                      paddingRight: 11,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: 'rgba(255,255,255,.25)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{name.slice(0, 1)}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#fff' }}>{name}</Text>
                    <Glyph size={12} color="#fff" strokeWidth={2.6}>
                      <Path d="M6 6l12 12M18 6 6 18" />
                    </Glyph>
                  </Pressable>
                ))}
                <Pressable
                  style={{
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 999,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                  }}
                  onPress={() => setCompanions((prev) => [...prev, '지훈'])}
                >
                  <Text style={{ fontSize: 13, color: c.text2 }}>+ 지훈</Text>
                </Pressable>
                <CompanionChip name="추가" dashed onPress={addCompanion} />
              </View>
            </View>

            {/* 사진 */}
            <View>
              <Text style={styleLabel(c)}>사진</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {photos.length === 0 ? (
                  <>
                    <View style={{ width: 60, height: 60, borderRadius: 11, backgroundColor: '#b7c4ca' }} />
                    <View style={{ width: 60, height: 60, borderRadius: 11, backgroundColor: '#d6b9a6' }} />
                  </>
                ) : (
                  photos.map((uri) => (
                    <Image key={uri} source={{ uri: photoUri(uri) }} style={{ width: 60, height: 60, borderRadius: 11 }} />
                  ))
                )}
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

            {/* 평점 */}
            <View>
              <Text style={styleLabel(c)}>평점</Text>
              <RatingInput value={rating} onChange={setRating} size={20} />
            </View>

            {/* 기분 */}
            <View>
              <Text style={styleLabel(c)}>기분</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MOODS.map((m, i) => {
                  const on = mood === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setMood(on ? -1 : i)}
                      accessibilityRole="button"
                      accessibilityLabel={`기분 ${m.label}`}
                      accessibilityState={{ selected: on }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        backgroundColor: on ? c.accentSoft : c.surface,
                        borderWidth: on ? 1.5 : 1,
                        borderColor: on ? c.accent : c.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Glyph size={20} color={on ? c.accent : c.text3} strokeWidth={2}>
                        <Path d="M12 12 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0" />
                        <Path d={m.d} />
                      </Glyph>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 메모 */}
            <View>
              <Text style={styleLabel(c)}>메모</Text>
              <View
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  minHeight: 46,
                }}
              >
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  multiline
                  placeholder="메모"
                  placeholderTextColor={c.text3}
                  style={{ fontSize: 13, color: c.text, lineHeight: 20, padding: 0 }}
                />
              </View>
            </View>
          </View>
        ) : (
          // Footer note — only in collapsed/quick state (2.1)
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 4,
            }}
          >
            <Icon.check size={14} color={c.text3} />
            <Text style={{ fontSize: 12, color: c.text3 }}>오프라인에서도 즉시 저장됩니다</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function DetailRow({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      {children}
    </View>
  );
}

function styleLabel(c: ReturnType<typeof useTheme>['c']) {
  return {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.text,
    marginBottom: 7,
  };
}

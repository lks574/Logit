import { useNavigation } from '@react-navigation/native';
import { choosePhoto } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { DisclosureButton } from '../../../components/Field';
import { Chip } from '../../../components/controls';
import { CompanionChip, RatingInput } from '../../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';

// SetRepForm (HTML 3.2, lines 503–556) — 세트·횟수형 (strength template).
// 운동 부위 chips · per-exercise set table · ＋세트/종목 추가 · 볼륨/시간 summary
// · 공통 세부 입력 disclosure. Supports create + edit (recordId).

type SetRow = { set: string; reps: string; weight: string; warmup: boolean };

const PARTS = ['가슴', '삼두', '등', '어깨', '하체'];

// fields.세트(JSON)에서 세트 행 복원. 저장값이 없거나 손상 시 빈 1행으로 시작.
function parseRows(saved?: string): SetRow[] {
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((r) => ({
          set: String(r?.set ?? ''),
          reps: String(r?.reps ?? ''),
          weight: String(r?.weight ?? ''),
          warmup: !!r?.warmup,
        }));
      }
    } catch {}
  }
  return [{ set: '1', reps: '', weight: '', warmup: false }];
}

export default function SetRepForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, today } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [part, setPart] = React.useState(record?.fields?.부위 ?? '');
  const [open, setOpen] = React.useState(editing);
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [place, setPlace] = React.useState(record?.fields?.장소 ?? '');
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [총볼륨, set총볼륨] = React.useState(record?.fields?.총볼륨 ?? '');
  const [운동시간, set운동시간] = React.useState(record?.fields?.운동시간 ?? '');
  const [rows, setRows] = React.useState<SetRow[]>(() => parseRows(record?.fields?.세트));

  const addSet = () =>
    setRows((r) => [
      ...r,
      { set: String(r.filter((x) => x.set !== 'W').length + 1), reps: '', weight: '', warmup: false },
    ]);

  const toggleWarmup = (i: number) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, warmup: !row.warmup } : row)));

  const setCell = (i: number, key: 'reps' | 'weight', val: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const pickPhoto = async () => {
    const uri = await choosePhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const handleSave = () => {
    const hasSet = rows.some((r) => r.reps.trim() !== '' || r.weight.trim() !== '');
    if (part.trim() === '' && 총볼륨.trim() === '' && !hasSet) {
      Alert.alert('필수 항목', '운동 부위나 세트 정보를 입력해 주세요.');
      return;
    }
    const fields: Record<string, string> = {};
    if (part) fields.부위 = part;
    if (총볼륨) fields.총볼륨 = 총볼륨;
    if (운동시간) fields.운동시간 = 운동시간;
    if (place) fields.장소 = place;
    const filledRows = rows.filter((r) => r.reps.trim() !== '' || r.weight.trim() !== '');
    if (filledRows.length) fields.세트 = JSON.stringify(filledRows);

    const meta = [part, 총볼륨 ? `총 볼륨 ${총볼륨}` : '']
      .filter(Boolean)
      .join(' · ');

    const payload = {
      activity,
      template: 'setrep' as const,
      dateISO: editing && record ? record.dateISO : today,
      timeLabel: editing && record ? record.timeLabel : '방금',
      meta,
      rating,
      memo,
      companions,
      photos,
      fields,
    };
    if (editing && recordId) {
      updateRecord(recordId, payload);
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
        icon={<Icon.dumbbell size={13} color={c.strength} strokeWidth={2.2} />}
        color={c.strength}
        soft={c.strengthSoft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 운동 부위 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 8 }}>운동 부위</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {PARTS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={p === part}
                color={c.strength}
                onPress={() => setPart(p)}
              />
            ))}
          </View>
        </View>

        {/* 벤치프레스 세트 테이블 */}
        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>벤치프레스</Text>
            <Text style={{ fontSize: 12, color: c.text3 }}>{rows.length}세트</Text>
          </View>

          {/* column header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14 }}>
            <Text style={{ width: 30, fontSize: 11, fontWeight: '600', color: c.text3 }}>세트</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>반복</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>중량</Text>
            <Text style={{ width: 44, fontSize: 11, fontWeight: '600', color: c.text3, textAlign: 'right' }}>워밍업</Text>
          </View>

          {rows.map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <Text style={{ width: 30, fontSize: 13, color: c.text2 }}>{row.set}</Text>
              <TextInput
                value={row.reps}
                onChangeText={(v) => setCell(i, 'reps', v)}
                placeholder="0"
                placeholderTextColor={c.text3}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text, padding: 0 }}
              />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  value={row.weight}
                  onChangeText={(v) => setCell(i, 'weight', v)}
                  placeholder="0"
                  placeholderTextColor={c.text3}
                  keyboardType="numeric"
                  style={{ fontSize: 14, fontWeight: '600', color: c.text, padding: 0 }}
                />
                <Text style={{ fontSize: 11, fontWeight: '500', color: c.text3 }}>kg</Text>
              </View>
              <View style={{ width: 44, alignItems: 'flex-end' }}>
                <Pressable
                  onPress={() => toggleWarmup(i)}
                  hitSlop={8}
                  style={{
                    width: 34,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: row.warmup ? c.strength : c.surfaceAlt,
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      marginLeft: row.warmup ? 16 : 2,
                      shadowColor: '#000',
                      shadowOpacity: row.warmup ? 0 : 0.2,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: row.warmup ? 0 : 1,
                    }}
                  />
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addSet}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 11,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <Icon.plus size={15} color={c.strength} strokeWidth={2.4} />
            <Text style={{ color: c.strength, fontSize: 13, fontWeight: '600' }}>세트 추가</Text>
          </Pressable>
        </View>

        {/* 인클라인 덤벨 (collapsed exercise) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 13,
            paddingVertical: 13,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>인클라인 덤벨</Text>
          <Icon.chevronRight size={18} color={c.text3} strokeWidth={2} />
        </View>

        {/* ＋종목 추가 */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            paddingVertical: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: c.border,
            borderRadius: 13,
          }}
        >
          <Icon.plus size={16} color={c.text2} strokeWidth={2.2} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>종목 추가</Text>
        </Pressable>

        {/* summary */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.strengthSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: c.text2 }}>
              총 볼륨 <Text style={{ fontSize: 10, fontWeight: '600', color: c.strength }}>자동</Text>
            </Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
              {총볼륨 ? (
                <>
                  {총볼륨.replace(/kg$/, '')}
                  <Text style={{ fontSize: 12, color: c.text2 }}>kg</Text>
                </>
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text3 }}>자동</Text>
              )}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: c.text2 }}>운동 시간</Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
              {운동시간 ? (
                <>
                  {운동시간.replace(/분$/, '')}
                  <Text style={{ fontSize: 12, color: c.text2 }}>분</Text>
                </>
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text3 }}>예: 52분</Text>
              )}
            </Text>
          </View>
        </View>

        {/* 공통 세부 입력 (collapsed default) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용"
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />
        {/* Expanded detail fields (common skeleton 2.2, strength template) */}
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
                {companions.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => setCompanions((list) => list.filter((n) => n !== name))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: c.strength,
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
                {!companions.includes('지훈') ? (
                  <Pressable
                    onPress={() => setCompanions((list) => [...list, '지훈'])}
                    style={{
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 999,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: c.text2 }}>+ 지훈</Text>
                  </Pressable>
                ) : null}
                <CompanionChip
                  name="추가"
                  dashed
                  onPress={() => setCompanions((list) => [...list, `동행 ${list.length + 1}`])}
                />
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
                    <Image key={uri} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 11 }} />
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
                {[
                  { d: 'M8.5 15.5c1-1.4 6-1.4 7 0M9 9.5h.01M15 9.5h.01', on: false },
                  { d: 'M8.5 14h7M9 9.5h.01M15 9.5h.01', on: false },
                  { d: 'M8.5 13.5c1 1.4 6 1.4 7 0M9 9.5h.01M15 9.5h.01', on: true },
                  { d: 'M8 13c1.2 2 6.8 2 8 0M9 9.5h.01M15 9.5h.01', on: false },
                ].map((m, i) => (
                  <View
                    key={i}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      backgroundColor: m.on ? c.strengthSoft : c.surface,
                      borderWidth: m.on ? 1.5 : 1,
                      borderColor: m.on ? c.strength : c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Glyph size={20} color={m.on ? c.strength : c.text3} strokeWidth={2}>
                      <Path d="M12 12 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0" />
                      <Path d={m.d} />
                    </Glyph>
                  </View>
                ))}
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
                  placeholder="메모"
                  placeholderTextColor={c.text3}
                  multiline
                  style={{ fontSize: 13, color: c.text, lineHeight: 20, padding: 0, textAlignVertical: 'top' }}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
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

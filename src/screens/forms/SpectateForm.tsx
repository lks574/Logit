import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton } from '../../components/Field';
import { RatingInput, CompanionChip } from '../../components/Rating';
import { Stepper, Chip } from '../../components/controls';
import { Glyph, Path, Rect, Circle, Icon } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';

// 3.4 SpectateForm — 관람·공연형 (perf color). Copy: Logit.dc.html lines 618–678.

export default function SpectateForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, today } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // Prefill controlled state from the record when editing.
  const [title, setTitle] = React.useState(record?.fields?.작품 ?? '');
  const [venue, setVenue] = React.useState(record?.fields?.공연장 ?? '');
  const [seat, setSeat] = React.useState(record?.fields?.좌석 ?? '');
  const [round, setRound] = React.useState(() => {
    const raw = record?.fields?.회차;
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : 1;
  });
  const [runtime, setRuntime] = React.useState(record?.fields?.러닝타임 ?? '');
  const [ticket, setTicket] = React.useState(record?.fields?.티켓 ?? '');
  const [cast, setCast] = React.useState<string[]>(() => {
    const raw = record?.fields?.출연진;
    return raw ? raw.split(' · ').map((s) => s.trim()).filter(Boolean) : [];
  });
  const [castDraft, setCastDraft] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [open, setOpen] = React.useState(editing);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const commitCast = () => {
    const name = castDraft.trim();
    if (name) setCast((p) => [...p, name]);
    setCastDraft('');
    setAdding(false);
  };

  const handleSave = () => {
    const payload = {
      activity,
      template: 'spectate' as const,
      dateISO: editing && record ? record.dateISO : today,
      timeLabel: editing && record ? record.timeLabel : '방금',
      meta: `〈${title || '작품'}〉 · ${venue || ''}`.trim(),
      rating,
      memo,
      companions,
      photos,
      fields: {
        작품: title,
        공연장: venue,
        회차: `${round}차`,
        ...(runtime ? { 러닝타임: runtime } : {}),
        ...(ticket ? { 티켓: ticket } : {}),
        출연진: cast.join(' · '),
      },
    };
    if (editing && recordId) {
      updateRecord(recordId, payload);
      nav.goBack();
    } else {
      addRecord(payload);
      nav.navigate('MainTabs');
    }
  };

  // Small labeled controlled input card (공연장/좌석/러닝타임/티켓).
  const inputCard = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    placeholder: string,
    flex: number,
    keyboardType?: 'default' | 'numeric',
  ) => (
    <View
      style={{
        flex,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 13,
      }}
    >
      <Text style={{ fontSize: 12, color: c.text2 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text3}
        keyboardType={keyboardType}
        style={{ fontSize: 14, fontWeight: '600', color: c.text, marginTop: 3, padding: 0 }}
      />
    </View>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<Icon.performance size={13} color={c.perf} strokeWidth={2.2} />}
        color={c.perf}
        soft={c.perfSoft}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 13 }}>
        {/* 작품명 — required */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>필수</Text>
          <View style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.perf, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, color: c.text2 }}>작품명</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="레미제라블"
              placeholderTextColor={c.text3}
              style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 3, padding: 0 }}
            />
          </View>
        </View>

        {/* 공연장 / 좌석 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {inputCard('공연장', venue, setVenue, '블루스퀘어', 1.4)}
          {inputCard('좌석', seat, setSeat, '1층 F12', 1)}
        </View>

        {/* 관람 회차 — Stepper (perf color) */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 13,
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: c.text2 }}>관람 회차</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.perf, marginTop: 2 }}>{round}차</Text>
            </View>
            <Stepper value={round} onChange={setRound} format={(v) => `${v}차`} color={c.perf} />
          </View>
        </View>

        {/* 러닝타임 / 티켓 가격 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {inputCard('러닝타임', runtime, setRuntime, '170분', 1)}
          {inputCard('티켓 가격', ticket, setTicket, '₩150,000', 1)}
        </View>

        {/* 출연진 chips */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>출연진</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {cast.map((name, i) => (
              <Chip
                key={`${name}-${i}`}
                label={name}
                selected={i === 0}
                color={c.perf}
                onPress={() => setCast((p) => p.filter((_, idx) => idx !== i))}
              />
            ))}
            {adding ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 13,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.perf,
                }}
              >
                <TextInput
                  value={castDraft}
                  onChangeText={setCastDraft}
                  placeholder="역할 · 배우"
                  placeholderTextColor={c.text3}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={commitCast}
                  onBlur={commitCast}
                  style={{ fontSize: 13, color: c.text, padding: 0, minWidth: 80 }}
                />
              </View>
            ) : (
              <Chip
                label="추가"
                dashed
                icon={<Icon.plus size={13} color={c.text2} strokeWidth={2.2} />}
                onPress={() => setAdding(true)}
              />
            )}
          </View>
        </View>

        {/* 셋리스트 · 넘버 (콘서트 전환) — last element in HTML (margin-top:auto) */}
        <DisclosureButton
          title="셋리스트 · 넘버"
          subtitle="콘서트는 셋리스트로 전환"
          icon={
            <Glyph size={17} color={c.text2}>
              <Path d="M9 18V5l12-2v13" />
              <Circle cx="6" cy="18" r="3" />
              <Circle cx="18" cy="16" r="3" />
            </Glyph>
          }
          open={open}
          onPress={() => setOpen((o) => !o)}
        />

        {/* Expanded — 세부 입력: 평점 · 메모 · 함께한 사람 · 사진 */}
        {open ? (
          <>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>평점</Text>
              <RatingInput value={rating} onChange={setRating} />
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>메모</Text>
              <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="감상을 남겨보세요"
                  placeholderTextColor={c.text3}
                  multiline
                  style={{ fontSize: 14, color: c.text, padding: 0, minHeight: 44, textAlignVertical: 'top' }}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>함께한 사람</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
                {companions.map((name, i) => (
                  <Pressable key={`${name}-${i}`} onPress={() => setCompanions((p) => p.filter((_, idx) => idx !== i))}>
                    <CompanionChip name={name} />
                  </Pressable>
                ))}
                <CompanionChip name="추가" dashed onPress={() => setCompanions((p) => [...p, `동행 ${p.length + 1}`])} />
              </View>
            </View>

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
          </>
        ) : null}
      </View>
    </Screen>
  );
}

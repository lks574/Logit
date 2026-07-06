import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { RatingInput, CompanionField } from '../../../components/Rating';
import { Stepper, Chip } from '../../../components/controls';
import { Glyph, Path, Rect, Icon } from '../../../components/Glyph';
import { DateTimeField, nowDateISO, nowTimeLabel } from '../../../components/DateTimeField';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { withAlpha } from '../../../theme/tokens';

// 3.4 SpectateForm — 관람·공연형 (perf color). Copy: Logit.dc.html lines 618–678.

// 출연진 칩 색: 이름 해시로 팔레트에서 선택 → 같은 이름은 항상 같은 색.
const castHash = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
};

// 라벨 + 입력 카드. 카드 아무 곳이나 탭하면 입력에 포커스(입력부만 눌러야 하던 불편 해소).
function InputCard({
  label,
  value,
  onChangeText,
  placeholder,
  flex,
  keyboardType,
  center,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  flex: number;
  keyboardType?: 'default' | 'numeric';
  center?: boolean;
}) {
  const { c } = useTheme();
  const ref = React.useRef<TextInput>(null);
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={{
        flex,
        justifyContent: center ? 'center' : 'flex-start',
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
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text3}
        keyboardType={keyboardType}
        style={{ fontSize: 14, fontWeight: '600', color: c.text, marginTop: 3, padding: 0 }}
      />
    </Pressable>
  );
}

export default function SpectateForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // Prefill controlled state from the record when editing.
  // 날짜·시간: 편집이면 저장값, 신규면 현재 날짜/시각.
  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? nowTimeLabel());
  const [title, setTitle] = React.useState(record?.fields?.작품 ?? '');
  const [venue, setVenue] = React.useState(record?.fields?.공연장 ?? '');
  const [seat, setSeat] = React.useState(record?.fields?.좌석 ?? '');
  const [round, setRound] = React.useState(() => {
    const raw = record?.fields?.회차;
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : 1;
  });
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
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);

  const pickPhoto = async () => {
    const uri = await choosePhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const castPalette = [c.perf, c.team, c.cardio, c.strength, c.accent, c.warning];
  const castColor = (name: string) => castPalette[castHash(name) % castPalette.length];

  const commitCast = () => {
    const name = castDraft.trim();
    if (name) setCast((p) => [...p, name]);
    setCastDraft('');
    setAdding(false);
  };

  const handleSave = () => {
    if (title.trim() === '') {
      Alert.alert('필수 항목', '작품명을 입력해 주세요.');
      return;
    }
    const fields: Record<string, string> = {
      ...(title ? { 작품: title } : {}),
      ...(venue ? { 공연장: venue } : {}),
      ...(seat ? { 좌석: seat } : {}),
      ...(round ? { 회차: `${round}차` } : {}),
      ...(ticket ? { 티켓: ticket } : {}),
      ...(cast.length ? { 출연진: cast.join(' · ') } : {}),
    };
    const payload = {
      activity,
      template: 'spectate' as const,
      dateISO,
      timeLabel,
      meta: title ? `〈${title}〉${venue ? ' · ' + venue : ''}` : venue || '',
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

  const titleRef = React.useRef<TextInput>(null);
  const memoRef = React.useRef<TextInput>(null);

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
          <Pressable onPress={() => titleRef.current?.focus()} style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.perf, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, color: c.text2 }}>작품명</Text>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder="작품명"
              placeholderTextColor={c.text3}
              style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 3, padding: 0 }}
            />
          </Pressable>
        </View>

        {/* 날짜 · 시간 (편집 가능) */}
        <DateTimeField
          dateISO={dateISO}
          timeLabel={timeLabel}
          onChangeDate={setDateISO}
          onChangeTime={setTimeLabel}
          color={c.perf}
        />

        {/* 공연장 / 좌석 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InputCard label="공연장" value={venue} onChangeText={setVenue} placeholder="공연장" flex={1.4} />
          <InputCard label="좌석" value={seat} onChangeText={setSeat} placeholder="좌석" flex={1} />
        </View>

        {/* 관람 회차 / 티켓 가격 — 한 줄 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 13,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: c.text2 }}>관람 회차</Text>
            <Stepper value={round} onChange={setRound} format={(v) => `${v}차`} color={c.perf} />
          </View>
          <InputCard label="티켓 가격" value={ticket} onChangeText={setTicket} placeholder="예: 150,000원" flex={1} center />
        </View>

        {/* 출연진 chips */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>출연진</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {cast.map((name, i) => {
              const col = castColor(name);
              return (
                <View
                  key={`${name}-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingLeft: 12,
                    paddingRight: 6,
                    backgroundColor: withAlpha(col, 14),
                    borderWidth: 1,
                    borderColor: withAlpha(col, 45),
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: col }}>{name}</Text>
                  <Pressable
                    onPress={() => setCast((p) => p.filter((_, idx) => idx !== i))}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`${name} 삭제`}
                    style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: withAlpha(col, 22), alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Glyph size={9} color={col} strokeWidth={2.6}>
                      <Path d="M6 6l12 12M18 6l-12 12" />
                    </Glyph>
                  </Pressable>
                </View>
              );
            })}
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
                  placeholder="배우"
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

        {/* 세부 입력: 평점 · 메모 · 함께한 사람 · 사진 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>평점</Text>
          <RatingInput value={rating} onChange={setRating} />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>메모</Text>
          <Pressable onPress={() => memoRef.current?.focus()} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
            <TextInput
              ref={memoRef}
              value={memo}
              onChangeText={setMemo}
              placeholder="메모"
              placeholderTextColor={c.text3}
              multiline
              style={{ fontSize: 14, color: c.text, padding: 0, minHeight: 44, textAlignVertical: 'top' }}
            />
          </Pressable>
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>함께한 사람</Text>
          <CompanionField companions={companions} onChange={setCompanions} />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>사진</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((uri) => (
              <View key={uri} style={{ width: 60, height: 60 }}>
                <Image source={{ uri: photoUri(uri) }} style={{ width: 60, height: 60, borderRadius: 11 }} />
                <Pressable
                  onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="사진 삭제"
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: c.text, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bg }}
                >
                  <Glyph size={9} color={c.bg} strokeWidth={2.8}>
                    <Path d="M6 6l12 12M18 6l-12 12" />
                  </Glyph>
                </Pressable>
              </View>
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
      </View>
    </Screen>
  );
}

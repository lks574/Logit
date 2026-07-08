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
import { resetToHome } from '../../../navigation/nav';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { withAlpha } from '../../../theme/tokens';
import { tr } from '../../../i18n/i18n';
import { activityLabel } from '../../../data/activities';

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
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  flex: number;
  keyboardType?: 'default' | 'numeric';
  center?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
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
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.text3}
        keyboardType={keyboardType}
        style={{ fontSize: 14, fontWeight: '600', color: c.text, marginTop: 3, padding: 0 }}
      />
    </Pressable>
  );
}

export default function SpectateForm({ activity, recordId, plan }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, records, completePlan } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // 공연장 자동완성: 과거 기록의 공연장 값만(최근순·중복 제거) 모아 추천.
  const [venueFocused, setVenueFocused] = React.useState(false);
  const pastVenues = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of records) {
      const v = r.fields?.공연장?.trim();
      if (v && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }, [records]);

  // Prefill controlled state from the record when editing.
  // 날짜·시간: 편집이면 저장값, 신규면 현재 날짜/시각.
  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? plan?.timeLabel ?? nowTimeLabel());
  const [title, setTitle] = React.useState(record?.fields?.작품 ?? '');
  const [venue, setVenue] = React.useState(record?.fields?.공연장 ?? plan?.place ?? '');
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
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);

  const pickPhoto = async () => {
    const uris = await choosePhoto();
    if (uris.length) setPhotos((p) => [...p, ...uris]);
  };

  // 신규 기록: 작품명이 과거 관람과 같으면 회차를 자동 계산(같은 작품 N번 → N+1차).
  // 회차 접미사 "(2)"는 무시하고 기본 제목으로 비교. 수정 중엔 건드리지 않는다.
  const baseTitle = (s: string) => s.replace(/\s*\(\d+\)\s*$/, '').trim();
  React.useEffect(() => {
    if (editing) return;
    const base = baseTitle(title);
    if (!base) { setRound(1); return; }
    const seen = records.filter(
      (r) => r.template === 'spectate' && baseTitle(r.fields?.작품 ?? '') === base,
    ).length;
    setRound(seen + 1);
  }, [title, editing, records]);

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
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Enter a title.', ko: '작품명을 입력해 주세요.' }),
      );
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
      if (plan) completePlan(plan.id); // 약속 → 기록 전환: 저장 시 약속 완료 처리
      resetToHome(nav);
    }
  };

  const titleRef = React.useRef<TextInput>(null);
  const memoRef = React.useRef<TextInput>(null);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activityLabel(activity)}
        icon={<Icon.performance size={13} color={c.perf} strokeWidth={2.2} />}
        color={c.perf}
        soft={c.perfSoft}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 13 }}>
        {/* 작품명 — required */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>{tr({ en: 'Required', ko: '필수' })}</Text>
          <Pressable onPress={() => titleRef.current?.focus()} style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.perf, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, color: c.text2 }}>{tr({ en: 'Title', ko: '작품명' })}</Text>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder={tr({ en: 'Title', ko: '작품명' })}
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
          allowNoTime
        />

        {/* 공연장 / 좌석 */}
        <View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <InputCard
              label={tr({ en: 'Venue', ko: '공연장' })}
              value={venue}
              onChangeText={setVenue}
              placeholder={tr({ en: 'Venue', ko: '공연장' })}
              flex={1.4}
              onFocus={() => setVenueFocused(true)}
              onBlur={() => setTimeout(() => setVenueFocused(false), 150)}
            />
            <InputCard label={tr({ en: 'Seat', ko: '좌석' })} value={seat} onChangeText={setSeat} placeholder={tr({ en: 'Seat', ko: '좌석' })} flex={1} />
          </View>
          {/* 공연장 자동완성 추천 (포커스 시) */}
          {venueFocused &&
            (() => {
              const q = venue.trim().toLowerCase();
              const sugg = pastVenues
                .filter((v) => v.toLowerCase() !== q && (q === '' || v.toLowerCase().includes(q)))
                .slice(0, 6);
              if (!sugg.length) return null;
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
                  {sugg.map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => {
                        setVenue(v);
                        setVenueFocused(false);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.perfSoft, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}
                    >
                      <Icon.performance size={11} color={c.perf} strokeWidth={2.2} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: c.perf }}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })()}
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
            <Text style={{ fontSize: 12, color: c.text2 }}>{tr({ en: 'Viewing', ko: '관람 회차' })}</Text>
            <Stepper value={round} onChange={setRound} format={(v) => tr({ en: `#${v}`, ko: `${v}차` })} color={c.perf} />
          </View>
          <InputCard label={tr({ en: 'Ticket price', ko: '티켓 가격' })} value={ticket} onChangeText={setTicket} placeholder={tr({ en: 'e.g. 150,000 KRW', ko: '예: 150,000원' })} flex={1} center />
        </View>

        {/* 출연진 chips */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Cast', ko: '출연진' })}</Text>
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
                    accessibilityLabel={tr({ en: `Delete ${name}`, ko: `${name} 삭제` })}
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
                  placeholder={tr({ en: 'Actor', ko: '배우' })}
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
                label={tr({ en: 'Add', ko: '추가' })}
                dashed
                icon={<Icon.plus size={13} color={c.text2} strokeWidth={2.2} />}
                onPress={() => setAdding(true)}
              />
            )}
          </View>
        </View>

        {/* 세부 입력: 평점 · 메모 · 함께한 사람 · 사진 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Rating', ko: '평점' })}</Text>
          <RatingInput value={rating} onChange={setRating} />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Memo', ko: '메모' })}</Text>
          <Pressable onPress={() => memoRef.current?.focus()} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
            <TextInput
              ref={memoRef}
              value={memo}
              onChangeText={setMemo}
              placeholder={tr({ en: 'Memo', ko: '메모' })}
              placeholderTextColor={c.text3}
              multiline
              style={{ fontSize: 14, color: c.text, padding: 0, minHeight: 44, textAlignVertical: 'top' }}
            />
          </Pressable>
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Companions', ko: '함께한 사람' })}</Text>
          <CompanionField companions={companions} onChange={setCompanions} />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Photos', ko: '사진' })}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((uri) => (
              <View key={uri} style={{ width: 60, height: 60 }}>
                <Image source={{ uri: photoUri(uri) }} style={{ width: 60, height: 60, borderRadius: 11 }} />
                <Pressable
                  onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={tr({ en: 'Delete photo', ko: '사진 삭제' })}
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

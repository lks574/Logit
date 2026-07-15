import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { DisclosureButton } from '../../../components/Field';
import { Chip } from '../../../components/controls';
import { CompanionField, RatingInput } from '../../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { useStore } from '../../../store/StoreContext';
import { resetToHome } from '../../../navigation/nav';
import { DateTimeField, nowDateISO, nowTimeLabel } from '../../../components/DateTimeField';
import { PrefillBanner } from '../../../components/PrefillBanner';
import { useTheme } from '../../../theme/ThemeContext';
import { withAlpha } from '../../../theme/tokens';
import { tr } from '../../../i18n/i18n';
import { activityLabel } from '../../../data/activities';
import { Exercise, emptyExercise, parseExercises, totalVolume, cleanExercises, recentExercises } from '../../../lib/strength';

// SetRepForm — 세트·횟수형 (strength template). 점진적 공개(progressive disclosure):
//  1단계(기본 노출): 운동 시간(분) + 부위(다중 선택) — 10초 기록.
//  2단계: "종목 기록" 섹션 펼쳐 종목 이름만.
//  3단계: 종목별 세트(횟수·중량) 상세.
// 종목 이름은 과거 기록에서 추출한 "최근 종목" 칩으로 재입력 없이 추가(마지막 세트 프리필).
// Supports create + edit (recordId) — 저장된 깊이만큼 자동으로 펼쳐서 연다.

// value는 저장·비교용(번역 금지, fields.부위), label은 표시용 번역.
const PARTS = [
  { value: '가슴', label: { en: 'Chest', ko: '가슴' } },
  { value: '삼두', label: { en: 'Triceps', ko: '삼두' } },
  { value: '등', label: { en: 'Back', ko: '등' } },
  { value: '어깨', label: { en: 'Shoulders', ko: '어깨' } },
  { value: '하체', label: { en: 'Legs', ko: '하체' } },
];

// 기분 4단계 — 이모지 + 저장 라벨(fields.기분). 이모지라 표정 구분이 확실.
// label은 저장·비교용(번역 금지), name은 표시용(a11y) 번역.
const MOODS = [
  { emoji: '🙁', label: '별로', name: { en: 'Bad', ko: '별로' } },
  { emoji: '😐', label: '보통', name: { en: 'Okay', ko: '보통' } },
  { emoji: '🙂', label: '좋음', name: { en: 'Good', ko: '좋음' } },
  { emoji: '😄', label: '최고', name: { en: 'Great', ko: '최고' } },
];

export default function SetRepForm({ activity, recordId, plan, initialDate }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan; initialDate?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, records, completePlan } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? initialDate ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? plan?.timeLabel ?? nowTimeLabel());
  // 부위 다중 선택 — 저장은 '가슴·삼두' 형태(레거시 단일값도 그대로 복원됨).
  const [parts, setParts] = React.useState<string[]>(() =>
    record?.fields?.부위 ? record.fields.부위.split('·').filter(Boolean) : [],
  );
  const [open, setOpen] = React.useState(editing);
  // 종목 기록 섹션 — 신규는 접힘(1단계 시작), 종목이 저장된 기록을 열면 자동으로 펼침.
  const [exOpen, setExOpen] = React.useState(() => !!(record?.fields?.운동 || record?.fields?.세트));
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [place, setPlace] = React.useState(record?.fields?.장소 ?? plan?.place ?? '');
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [mood, setMood] = React.useState<number>(() => MOODS.findIndex((m) => m.label === record?.fields?.기분));
  // 운동 시간은 분 단위 숫자만 입력받고 저장 시 '52분'으로 직렬화(레거시 값은 숫자만 추출해 복원).
  const [분, set분] = React.useState((record?.fields?.운동시간 ?? '').replace(/[^\d]/g, ''));
  // 종목: 신규는 빈 목록(종목 칩·추가 버튼으로 시작), 편집은 저장값(레거시 세트 포함) 복원.
  const [exercises, setExercises] = React.useState<Exercise[]>(() => (record ? parseExercises(record.fields) : []));

  const 분Ref = React.useRef<TextInput>(null);
  const moodColors = [c.error, c.warning, c.success, c.cardio];

  const togglePart = (v: string) => setParts((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  // 최근 같은 활동 기록 프리필 — 지난 세션의 종목 구성을 시작점으로 복사(결과성 값 제외).
  const lastRecord = React.useMemo(
    () => records.find((r) => r.activity === activity && r.id !== recordId),
    [records, activity, recordId],
  );
  const prefillFromLast = () => {
    if (!lastRecord) return;
    const f = lastRecord.fields ?? {};
    if (f.부위) setParts(f.부위.split('·').filter(Boolean));
    if (f.운동 || f.세트) {
      setExercises(parseExercises(f));
      setExOpen(true); // 복사된 깊이만큼 펼쳐서 보여준다
    }
    if (f.운동시간) set분(f.운동시간.replace(/[^\d]/g, ''));
    if (f.장소) setPlace(f.장소);
  };

  // "최근 종목" 칩 — 과거 기록에서 추출(관리 화면 없는 라이브러리). 이미 추가한 이름은 제외.
  const suggestions = React.useMemo(() => recentExercises(records), [records]);
  const availableSuggestions = suggestions.filter((s) => !exercises.some((e) => e.name.trim() === s.name));
  const addSuggested = (s: Exercise) =>
    setExercises((list) => [...list, { name: s.name, sets: s.sets.map((x) => ({ ...x })) }]); // 마지막 세트 구성 프리필

  const 총볼륨num = totalVolume(exercises);
  const 총볼륨 = 총볼륨num > 0 ? `${총볼륨num}kg` : '';

  // 종목 편집 헬퍼 — exercises[ei].sets[si] 불변 업데이트.
  const updateExercises = (fn: (list: Exercise[]) => Exercise[]) => setExercises(fn);
  const setExerciseName = (ei: number, name: string) =>
    updateExercises((list) => list.map((e, i) => (i === ei ? { ...e, name } : e)));
  const addExercise = () => updateExercises((list) => [...list, emptyExercise()]);
  const removeExercise = (ei: number) => updateExercises((list) => list.filter((_, i) => i !== ei));
  // 세트 추가 시 직전 세트의 반복·중량을 복사(대부분 같은 무게로 반복 — 입력 최소화).
  const addSet = (ei: number) =>
    updateExercises((list) =>
      list.map((e, i) => {
        if (i !== ei) return e;
        const prev = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { reps: prev?.reps ?? '', weight: prev?.weight ?? '', warmup: false }] };
      }),
    );
  const removeSet = (ei: number, si: number) =>
    updateExercises((list) => list.map((e, i) => (i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e)));
  const toggleWarmup = (ei: number, si: number) =>
    updateExercises((list) =>
      list.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, warmup: !s.warmup } : s)) } : e)),
    );
  const setCell = (ei: number, si: number, key: 'reps' | 'weight', val: string) =>
    updateExercises((list) =>
      list.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, [key]: val } : s)) } : e)),
    );

  const pickPhoto = async () => {
    const uris = await choosePhoto();
    if (uris.length) setPhotos((p) => [...p, ...uris]);
  };

  const handleSave = () => {
    const cleaned = cleanExercises(exercises);
    const partLabel = parts.join('·');
    const 운동시간 = 분 ? `${분}${tr({ en: ' min', ko: '분' })}` : '';
    if (!parts.length && !분 && cleaned.length === 0) {
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Enter a body part, time, or exercise.', ko: '운동 부위, 시간, 종목 중 하나를 입력해 주세요.' }),
      );
      return;
    }
    const fields: Record<string, string> = {};
    if (partLabel) fields.부위 = partLabel;
    if (총볼륨) fields.총볼륨 = 총볼륨;
    if (운동시간) fields.운동시간 = 운동시간;
    if (place) fields.장소 = place;
    if (mood >= 0) fields.기분 = MOODS[mood].label;
    if (cleaned.length) fields.운동 = JSON.stringify(cleaned);

    // meta는 깊이에 적응: 시간만 → '가슴 · 45분', 종목까지 → '가슴 · 2종목 · 볼륨 1464kg'.
    const exerciseCount = cleaned.length ? tr({ en: `${cleaned.length} exercises`, ko: `${cleaned.length}종목` }) : '';
    const metaParts = [partLabel, exerciseCount, 총볼륨 ? tr({ en: `vol ${총볼륨}`, ko: `볼륨 ${총볼륨}` }) : ''].filter(Boolean);
    if (!cleaned.length && 운동시간) metaParts.push(운동시간);
    const meta = metaParts.join(' · ');

    const payload = {
      activity,
      template: 'setrep' as const,
      dateISO,
      timeLabel,
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
      if (plan) completePlan(plan.id); // 약속 → 기록 전환: 저장 시 약속 완료 처리
      resetToHome(nav);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activityLabel(activity)}
        icon={<Icon.dumbbell size={13} color={c.strength} strokeWidth={2.2} />}
        color={c.strength}
        soft={c.strengthSoft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 날짜 · 시간 */}
        <DateTimeField dateISO={dateISO} timeLabel={timeLabel} onChangeDate={setDateISO} onChangeTime={setTimeLabel} color={c.strength} />

        {!editing && lastRecord ? <PrefillBanner activity={activity} onPress={prefillFromLast} /> : null}

        {/* 1단계 — 운동 시간(분) · 부위. 이것만 채워도 저장된다. */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 8 }}>{tr({ en: 'Workout time', ko: '운동 시간' })}</Text>
          <Pressable
            onPress={() => 분Ref.current?.focus()}
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
            <TextInput
              ref={분Ref}
              value={분}
              onChangeText={(v) => set분(v.replace(/[^\d]/g, ''))}
              placeholder="0"
              placeholderTextColor={c.text3}
              keyboardType="numeric"
              style={{ flex: 1, fontSize: 16, fontWeight: '700', color: c.text, padding: 0 }}
            />
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text3 }}>{tr({ en: 'min', ko: '분' })}</Text>
          </Pressable>
        </View>

        {/* 운동 부위 — 다중 선택(가슴+삼두 같은 복합 세션) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 8 }}>{tr({ en: 'Body parts', ko: '운동 부위' })}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {PARTS.map((p) => (
              <Chip
                key={p.value}
                label={tr(p.label)}
                selected={parts.includes(p.value)}
                color={c.strength}
                onPress={() => togglePart(p.value)}
              />
            ))}
          </View>
        </View>

        {/* 2·3단계 — 종목 기록(선택): 종목 이름만 적으면 2단계, 세트까지 채우면 3단계 */}
        <DisclosureButton
          title={tr({ en: 'Exercises', ko: '종목 기록' })}
          badge={tr({ en: 'Optional', ko: '선택' })}
          subtitle={tr({ en: 'Exercise names · Sets · Volume', ko: '종목 이름 · 세트 · 총 볼륨' })}
          icon={<Icon.dumbbell size={17} color={c.text2} strokeWidth={2.2} />}
          open={exOpen}
          onPress={() => setExOpen((o) => !o)}
        />

        {exOpen ? (
        <View style={{ gap: 14 }}>
        {/* 최근 종목 칩 — 과거 기록에서 추출, 탭하면 마지막 세트 구성째로 추가 */}
        {availableSuggestions.length ? (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 7 }}>{tr({ en: 'Recent exercises', ko: '최근 종목' })}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {availableSuggestions.map((s) => (
                <Chip key={s.name} label={`+ ${s.name}`} color={c.strength} onPress={() => addSuggested(s)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* 종목별 세트 테이블 (다종목) */}
        {exercises.map((ex, ei) => {
          return (
            <View
              key={ei}
              style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, overflow: 'hidden' }}
            >
              {/* 종목 헤더 — 이름 편집 + 세트 수 + 종목 삭제(2개 이상일 때) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <TextInput
                  value={ex.name}
                  onChangeText={(v) => setExerciseName(ei, v)}
                  placeholder={tr({ en: 'Exercise name (e.g. Bench press)', ko: '종목 이름 (예: 벤치프레스)' })}
                  placeholderTextColor={c.text3}
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: c.text, padding: 0 }}
                />
                <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: `${ex.sets.length} sets`, ko: `${ex.sets.length}세트` })}</Text>
                <Pressable
                  onPress={() => removeExercise(ei)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={tr({ en: 'Remove exercise', ko: '종목 삭제' })}
                >
                  <Glyph size={16} color={c.text3} strokeWidth={2}><Path d="M6 6l12 12M18 6l-12 12" /></Glyph>
                </Pressable>
              </View>

              {/* column header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14 }}>
                <Text style={{ width: 30, fontSize: 11, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Set', ko: '세트' })}</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Reps', ko: '반복' })}</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Weight', ko: '중량' })}</Text>
                <Text style={{ width: 40, fontSize: 11, fontWeight: '600', color: c.text3, textAlign: 'center' }}>{tr({ en: 'W-up', ko: '워밍업' })}</Text>
                <View style={{ width: 26 }} />
              </View>

              {ex.sets.map((row, si) => {
                // 세트 번호: 워밍업은 'W', 본세트는 앞선 본세트 수+1.
                const setNo = row.warmup ? 'W' : String(ex.sets.slice(0, si + 1).filter((s) => !s.warmup).length);
                return (
                  <View
                    key={si}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: c.border }}
                  >
                    <Text style={{ width: 30, fontSize: 13, color: c.text2 }}>{setNo}</Text>
                    <TextInput
                      value={row.reps}
                      onChangeText={(v) => setCell(ei, si, 'reps', v)}
                      placeholder="0"
                      placeholderTextColor={c.text3}
                      keyboardType="numeric"
                      style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text, padding: 0 }}
                    />
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        value={row.weight}
                        onChangeText={(v) => setCell(ei, si, 'weight', v)}
                        placeholder="0"
                        placeholderTextColor={c.text3}
                        keyboardType="numeric"
                        style={{ fontSize: 14, fontWeight: '600', color: c.text, padding: 0 }}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '500', color: c.text3 }}>kg</Text>
                    </View>
                    <View style={{ width: 40, alignItems: 'center' }}>
                      <Pressable
                        onPress={() => toggleWarmup(ei, si)}
                        hitSlop={8}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: row.warmup }}
                        style={{ width: 34, height: 20, borderRadius: 999, backgroundColor: row.warmup ? c.strength : c.surfaceAlt, justifyContent: 'center' }}
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
                    <View style={{ width: 26, alignItems: 'flex-end' }}>
                      {ex.sets.length > 1 ? (
                        <Pressable
                          onPress={() => removeSet(ei, si)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={tr({ en: 'Remove set', ko: '세트 삭제' })}
                        >
                          <Glyph size={15} color={c.text3} strokeWidth={2}><Path d="M5 12h14" /></Glyph>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              <Pressable
                onPress={() => addSet(ei)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderTopWidth: 1, borderTopColor: c.border }}
              >
                <Icon.plus size={15} color={c.strength} strokeWidth={2.4} />
                <Text style={{ color: c.strength, fontSize: 13, fontWeight: '600' }}>{tr({ en: 'Add set', ko: '세트 추가' })}</Text>
              </Pressable>
            </View>
          );
        })}

        {/* ＋종목 추가 */}
        <Pressable
          onPress={addExercise}
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Add exercise', ko: '종목 추가' })}</Text>
        </Pressable>

        {/* 총 볼륨 — 세트 값에서 전 종목 합산(자동) */}
        <View style={{ backgroundColor: c.strengthSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 11, color: c.text2 }}>
            {tr({ en: 'Total volume', ko: '총 볼륨' })} <Text style={{ fontSize: 10, fontWeight: '600', color: c.strength }}>{tr({ en: 'Auto', ko: '자동' })}</Text>
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
            {총볼륨 ? (
              <>
                {총볼륨.replace(/kg$/, '')}
                <Text style={{ fontSize: 12, color: c.text2 }}>kg</Text>
              </>
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Auto', ko: '자동' })}</Text>
            )}
          </Text>
        </View>
        </View>
        ) : null}

        {/* 공통 세부 입력 (collapsed default) */}
        <DisclosureButton
          title={tr({ en: 'More details', ko: '세부 입력' })}
          badge={tr({ en: 'Optional', ko: '선택' })}
          subtitle={tr({ en: 'Place · Companions · Photos · Memo · Rating · Mood', ko: '장소 · 동행 · 사진 · 메모 · 평점 · 기분' })}
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />
        {/* Expanded detail fields (common skeleton 2.2, strength template) */}
        {open ? (
          <View style={{ gap: 15 }}>
            {/* 장소 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Place', ko: '장소' })}</Text>
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
                  placeholder={tr({ en: 'Place', ko: '장소' })}
                  placeholderTextColor={c.text3}
                  style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                {[
                  { value: '올림픽공원', label: tr({ en: 'Recent · Olympic Park', ko: '최근 · 올림픽공원' }) },
                  { value: '양재천', label: tr({ en: 'Yangjaecheon', ko: '양재천' }) },
                ].map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setPlace(t.value)}
                    style={{
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 7,
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.text2 }}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 동행 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Companions', ko: '동행' })}</Text>
              <CompanionField companions={companions} onChange={setCompanions} />
            </View>

            {/* 사진 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Photos', ko: '사진' })}</Text>
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

            {/* 평점 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Rating', ko: '평점' })}</Text>
              <RatingInput value={rating} onChange={setRating} size={20} />
            </View>

            {/* 기분 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Mood', ko: '기분' })}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MOODS.map((m, i) => {
                  const on = mood === i;
                  const mc = moodColors[i];
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setMood(on ? -1 : i)}
                      accessibilityRole="button"
                      accessibilityLabel={tr({ en: `Mood ${tr(m.name)}`, ko: `기분 ${tr(m.name)}` })}
                      accessibilityState={{ selected: on }}
                      style={{
                        flex: 1,
                        height: 46,
                        borderRadius: 12,
                        backgroundColor: on ? withAlpha(mc, 15) : c.surface,
                        borderWidth: on ? 1.5 : 1,
                        borderColor: on ? mc : c.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <Text style={{ fontSize: 24, opacity: on ? 1 : 0.65 }}>{m.emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 메모 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Memo', ko: '메모' })}</Text>
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
                  placeholder={tr({ en: 'Memo', ko: '메모' })}
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

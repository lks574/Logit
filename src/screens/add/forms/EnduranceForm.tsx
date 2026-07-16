import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { CompanionField, RatingInput } from '../../../components/Rating';
import { DisclosureButton } from '../../../components/Field';
import { FormHeader } from '../../../components/FormHeader';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { Screen } from '../../../components/primitives';
import { activities, colorsFor } from '../../../data/activities';
import { useStore } from '../../../store/StoreContext';
import { resetToHome } from '../../../navigation/nav';
import { enduranceProfile, SWIM_STROKES } from '../../../data/endurance';
import { DateTimeField, nowDateISO, nowTimeLabel } from '../../../components/DateTimeField';
import { PrefillBanner } from '../../../components/PrefillBanner';
import { recentValues } from '../../../lib/history';
import { Chip } from '../../../components/controls';
import { useTheme } from '../../../theme/ThemeContext';
import { withAlpha } from '../../../theme/tokens';
import { tr } from '../../../i18n/i18n';
import { activityLabel } from '../../../data/activities';

// §03 3.1 거리·시간형 — EnduranceForm (cardio). Embeds §02 common skeleton.
// HTML source of truth: Logit.dc.html 2.1 (296–358), 2.2 (359–437), 3.1 (444–502).

// 기분 4단계 — 이모지 + 저장 라벨(fields.기분). 이모지라 표정 구분이 확실.
// label은 저장·비교용(번역 금지), name은 표시용(a11y) 번역.
const MOODS = [
  { emoji: '🙁', label: '별로', name: { en: 'Bad', ko: '별로' } },
  { emoji: '😐', label: '보통', name: { en: 'Okay', ko: '보통' } },
  { emoji: '🙂', label: '좋음', name: { en: 'Good', ko: '좋음' } },
  { emoji: '😄', label: '최고', name: { en: 'Great', ko: '최고' } },
];

export default function EnduranceForm({ activity, recordId, plan, initialDate }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan; initialDate?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, records, completePlan, profile } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? initialDate ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? plan?.timeLabel ?? nowTimeLabel());
  const [open, setOpen] = React.useState(editing); // 세부 입력 disclosure (open when editing)
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [place, setPlace] = React.useState(record?.fields?.장소 ?? plan?.place ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [mood, setMood] = React.useState<number>(() => MOODS.findIndex((m) => m.label === record?.fields?.기분));

  // Endurance core fields (prefilled from record.fields when editing, blank on create).
  // 시간은 분·초로 분리 입력(콜론 없이), 고도/칼로리/심박은 숫자만 받고 단위는 UI에서 표기.
  const parseMMSS = (s?: string) => {
    const m = (s ?? '').match(/(\d+):(\d+)/);
    return { mm: m ? m[1] : '', ss: m ? m[2] : '' };
  };
  const stripUnit = (s?: string) => (s ?? '').replace(/[^\d.]/g, '');
  const t0 = parseMMSS(record?.fields?.시간);
  const [거리, set거리] = React.useState(record?.fields?.거리 ?? '');
  const [분, set분] = React.useState(t0.mm);
  const [초, set초] = React.useState(t0.ss);
  const [고도, set고도] = React.useState(stripUnit(record?.fields?.고도));
  const [평균심박, set평균심박] = React.useState(stripUnit(record?.fields?.평균심박));
  // 종목 프로파일 — 자전거/수영/러닝별 단위·표시·칼로리. (store 유저 profile과 이름 구분 위해 prof)
  const prof = enduranceProfile(activity);
  const [stroke, setStroke] = React.useState(record?.fields?.영법 ?? SWIM_STROKES[0]);

  // 탭하면 포커스되도록 각 입력에 ref
  const 거리Ref = React.useRef<TextInput>(null);
  const 분Ref = React.useRef<TextInput>(null);
  const 고도Ref = React.useRef<TextInput>(null);
  const 심박Ref = React.useRef<TextInput>(null);
  const placeRef = React.useRef<TextInput>(null);
  const memoRef = React.useRef<TextInput>(null);

  // 거리 → km 환산(수영은 m 저장이라 /1000). 시간 → 초.
  const distNum = parseFloat((거리.match(/[\d.]+/) || ['0'])[0]) || 0;
  const km = prof.distanceUnit === 'm' ? distNum / 1000 : distNum;
  const totalSec = (parseInt(분 || '0', 10) || 0) * 60 + (parseInt(초 || '0', 10) || 0);
  // 러닝·자전거: 평균 속도 km/h. 수영: 100m당 페이스(m:ss).
  const autoSpeed = km > 0 && totalSec > 0 ? ((km * 3600) / totalSec).toFixed(1) : '';
  const swimPace = (() => {
    if (prof.kind !== 'swim' || km <= 0 || totalSec <= 0) return '';
    const per100 = Math.round(totalSec / (km * 10)); // 초/100m
    return `${Math.floor(per100 / 60)}:${String(per100 % 60).padStart(2, '0')}`;
  })();

  // 칼로리 — 종목별(러닝 ACSM / 자전거·수영 MET). 체중은 유저 profile에서.
  const autoCal = prof.calories({
    km,
    totalSec,
    elevationM: parseFloat(고도) || undefined,
    weightKg: profile.weightKg,
    stroke,
  });

  const template = activities[activity]?.template ?? 'endurance';
  const { color, soft } = colorsFor(template, c);
  const ActIcon = Icon[activities[activity]?.icon ?? 'running'];
  const moodColors = [c.team, c.warning, c.success, c.star]; // 별로·보통·좋음·최고 (부드러운 톤)

  const pickPhoto = async () => {
    const uris = await choosePhoto();
    if (uris.length) setPhotos((p) => [...p, ...uris]);
  };

  // 최근 같은 활동 기록(현재 편집 중인 것 제외). records는 최신순.
  const lastRecord = React.useMemo(
    () => records.find((r) => r.activity === activity && r.id !== recordId),
    [records, activity, recordId],
  );
  // 최근 장소 추천 — 내 과거 기록에서 추출(하드코딩 목업 대체).
  const recentPlaces = React.useMemo(() => recentValues(records, '장소', { excludeId: recordId }), [records, recordId]);
  const prefillFromLast = () => {
    if (!lastRecord) return;
    const f = lastRecord.fields ?? {};
    if (f.거리) set거리(f.거리);
    const t = parseMMSS(f.시간);
    set분(t.mm);
    set초(t.ss);
    set고도(stripUnit(f.고도));
    set평균심박(stripUnit(f.평균심박)); // 칼로리는 거리·시간·체중에서 자동 계산
    if (f.영법) setStroke(f.영법);
    if (f.장소) setPlace(f.장소);
  };


  const 시간val = 분 || 초 ? `${분 || '0'}:${String(초 || '0').padStart(2, '0')}` : '';

  const handleSave = () => {
    if (거리.trim() === '' && !시간val) {
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Enter a distance or time.', ko: '거리 또는 시간을 입력해 주세요.' }),
      );
      return;
    }
    // 거리는 종목 단위를 붙여 정규화 저장(런닝/자전거 km, 수영 m).
    const distStr = distNum > 0 ? `${distNum}${prof.distanceUnit}` : 거리.trim();
    // Build fields with only non-empty values so blank inputs are omitted.
    // 종목별로 속도(km/h) 또는 페이스(/100m), 고도(러닝·자전거만), 영법(수영만) 저장.
    const fieldEntries: [string, string][] = [
      ['거리', distStr],
      ['시간', 시간val],
      prof.kind === 'swim' ? ['페이스', swimPace ? `${swimPace}/100m` : ''] : ['속도', autoSpeed ? `${autoSpeed}km/h` : ''],
      ['고도', prof.showElevation && 고도 ? `${고도}m` : ''],
      ['칼로리', autoCal != null ? `${autoCal}kcal` : ''],
      ['평균심박', 평균심박 ? `${평균심박}bpm` : ''],
      ['영법', prof.showStroke ? stroke : ''],
      ['장소', place],
      ['기분', mood >= 0 ? MOODS[mood].label : ''],
    ];
    const fields = Object.fromEntries(fieldEntries.filter(([, v]) => v !== ''));

    // 카드 1줄 요약. Join only non-empty parts.
    const meta = [place, distStr, 시간val].filter(Boolean).join(' · ');

    const payload = {
      activity,
      template: 'endurance' as const,
      dateISO,
      timeLabel,
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
      if (plan) completePlan(plan.id); // 약속 → 기록 전환: 저장 시 약속 완료 처리
      resetToHome(nav);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activityLabel(activity)}
        icon={<ActIcon size={13} color={color} strokeWidth={2.2} />}
        color={color}
        soft={soft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, paddingTop: 14, gap: 14 }}>
        {/* 날짜 · 시간 */}
        <DateTimeField dateISO={dateISO} timeLabel={timeLabel} onChangeDate={setDateISO} onChangeTime={setTimeLabel} color={c.cardio} />

        {/* 최근 같은 활동 기록 프리필 — 신규 작성이고 이전 기록이 있을 때만 */}
        {!editing && lastRecord ? <PrefillBanner activity={activity} onPress={prefillFromLast} /> : null}

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
            {tr({ en: 'Key metrics · required', ko: '핵심 수치 · 필수' })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => 거리Ref.current?.focus()}
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
              <Text style={{ fontSize: 12, color: c.text2 }}>{tr({ en: 'Distance', ko: '거리' })}</Text>
              <TextInput
                ref={거리Ref}
                value={거리}
                onChangeText={set거리}
                placeholder={prof.distanceUnit === 'm' ? tr({ en: 'e.g. 1500m', ko: '예: 1500m' }) : tr({ en: 'e.g. 5.2km', ko: '예: 5.2km' })}
                placeholderTextColor={c.text3}
                style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 4, padding: 0 }}
              />
            </Pressable>
            <Pressable
              onPress={() => 분Ref.current?.focus()}
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
              <Text style={{ fontSize: 12, color: c.text2 }}>{tr({ en: 'Time', ko: '시간' })}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
                <TextInput
                  ref={분Ref}
                  value={분}
                  onChangeText={(v) => set분(v.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="27"
                  placeholderTextColor={c.text3}
                  maxLength={3}
                  style={{ fontSize: 24, fontWeight: '700', color: c.text, padding: 0, minWidth: 30 }}
                />
                <Text style={{ fontSize: 14, color: c.text2, marginHorizontal: 3, marginBottom: 3 }}>{tr({ en: 'min', ko: '분' })}</Text>
                <TextInput
                  value={초}
                  onChangeText={(v) => set초(v.replace(/[^\d]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  placeholder="12"
                  placeholderTextColor={c.text3}
                  maxLength={2}
                  style={{ fontSize: 24, fontWeight: '700', color: c.text, padding: 0, minWidth: 28 }}
                />
                <Text style={{ fontSize: 14, color: c.text2, marginLeft: 3, marginBottom: 3 }}>{tr({ en: 'sec', ko: '초' })}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 영법 (수영 전용) — 칼로리 MET가 영법별로 다름 */}
        {prof.showStroke ? (
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.44, marginBottom: 7 }}>
              {tr({ en: 'Stroke', ko: '영법' })}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {SWIM_STROKES.map((s) => (
                <Chip
                  key={s}
                  label={tr({ en: s === '자유형' ? 'Freestyle' : s === '배영' ? 'Backstroke' : s === '평영' ? 'Breaststroke' : s === '접영' ? 'Butterfly' : 'Medley', ko: s })}
                  selected={s === stroke}
                  color={color}
                  onPress={() => setStroke(s)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* 상세 수치 — 평균 속도/페이스(자동)/고도/칼로리/평균 심박 (3.1) */}
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
            {tr({ en: 'Detailed metrics', ko: '상세 수치' })}
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
              <Text style={{ fontSize: 14, color: c.text }}>
                {prof.kind === 'swim' ? tr({ en: 'Avg pace', ko: '평균 페이스' }) : tr({ en: 'Avg speed', ko: '평균 속도' })}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: (prof.kind === 'swim' ? swimPace : autoSpeed) ? c.text : c.text3, textAlign: 'right', minWidth: 52 }}>
                  {(prof.kind === 'swim' ? swimPace : autoSpeed) || tr({ en: 'Auto', ko: '자동' })}
                </Text>
                <Text style={{ fontSize: 13, color: c.text3 }}>{prof.kind === 'swim' ? '/100m' : 'km/h'}</Text>
                <View style={{ backgroundColor: soft, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color }}>{tr({ en: 'Auto', ko: '자동' })}</Text>
                </View>
              </View>
            </DetailRow>
            {prof.showElevation ? (
              <>
                <View style={{ height: 1, backgroundColor: c.border }} />
                <DetailRow onPress={() => 고도Ref.current?.focus()}>
                  <Text style={{ fontSize: 14, color: c.text }}>{tr({ en: 'Elevation gain', ko: '고도 상승' })}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TextInput
                      ref={고도Ref}
                      value={고도}
                      onChangeText={(v) => set고도(v.replace(/[^\d.]/g, ''))}
                      keyboardType="numeric"
                      placeholder="42"
                      placeholderTextColor={c.text3}
                      style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 44 }}
                    />
                    <Text style={{ fontSize: 13, color: c.text3 }}>m</Text>
                  </View>
                </DetailRow>
              </>
            ) : null}
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow onPress={profile.weightKg ? undefined : () => nav.navigate('ProfileEdit')}>
              <Text style={{ fontSize: 14, color: c.text }}>{tr({ en: 'Calories', ko: '칼로리' })}</Text>
              {profile.weightKg ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: autoCal != null ? c.text : c.text3, textAlign: 'right', minWidth: 44 }}>
                    {autoCal != null ? autoCal : tr({ en: 'Auto', ko: '자동' })}
                  </Text>
                  <Text style={{ fontSize: 13, color: c.text3 }}>kcal</Text>
                  <View style={{ backgroundColor: soft, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color }}>{tr({ en: 'Auto', ko: '자동' })}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: c.accent, fontWeight: '600' }}>{tr({ en: 'Set weight', ko: '체중 입력' })}</Text>
                  <Icon.chevronRight size={14} color={c.accent} strokeWidth={2.2} />
                </View>
              )}
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow onPress={() => 심박Ref.current?.focus()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Glyph size={16} color={c.error} strokeWidth={2}>
                  <Path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8-1c-2.2 2.2-2 5.6.4 8L12 21l8.4-7.4c2.4-2.4 2.6-5.8.4-8z" />
                </Glyph>
                <Text style={{ fontSize: 14, color: c.text }}>{tr({ en: 'Avg heart rate', ko: '평균 심박' })}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TextInput
                  ref={심박Ref}
                  value={평균심박}
                  onChangeText={(v) => set평균심박(v.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="152"
                  placeholderTextColor={c.text3}
                  style={{ fontSize: 15, fontWeight: '600', color: c.text, padding: 0, textAlign: 'right', minWidth: 44 }}
                />
                <Text style={{ fontSize: 13, color: c.text3 }}>bpm</Text>
              </View>
            </DetailRow>
          </View>
        </View>

        {/* 세부 입력 disclosure — collapsed by default (2.1) */}
        <DisclosureButton
          title={tr({ en: 'More details', ko: '세부 입력' })}
          badge={tr({ en: 'Optional', ko: '선택' })}
          subtitle={tr({ en: 'Place · Companions · Photos · Memo · Rating · Mood', ko: '장소 · 동행 · 사진 · 메모 · 평점 · 기분' })}
          open={open}
          onPress={() => setOpen((v) => !v)}
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
        />

        {/* Expanded detail fields (2.2) */}
        {open ? (
          <View style={{ gap: 15 }}>
            {/* 장소 */}
            <View>
              <Text style={styleLabel(c)}>{tr({ en: 'Place', ko: '장소' })}</Text>
              <Pressable
                onPress={() => placeRef.current?.focus()}
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
                  ref={placeRef}
                  value={place}
                  onChangeText={setPlace}
                  placeholder={tr({ en: 'Place', ko: '장소' })}
                  placeholderTextColor={c.text3}
                  style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
                />
              </Pressable>
              {recentPlaces.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                  {recentPlaces.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setPlace(p)}
                      style={{
                        backgroundColor: c.surface,
                        borderWidth: 1,
                        borderColor: c.border,
                        borderRadius: 7,
                        paddingVertical: 5,
                        paddingHorizontal: 9,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: c.text2 }}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
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
              <Pressable
                onPress={() => memoRef.current?.focus()}
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  minHeight: 46,
                }}
              >
                <TextInput
                  ref={memoRef}
                  value={memo}
                  onChangeText={setMemo}
                  multiline
                  placeholder={tr({ en: 'Memo', ko: '메모' })}
                  placeholderTextColor={c.text3}
                  style={{ fontSize: 13, color: c.text, lineHeight: 20, padding: 0 }}
                />
              </Pressable>
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
            <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'Saved instantly, even offline', ko: '오프라인에서도 즉시 저장됩니다' })}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function DetailRow({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
  };
  return onPress ? (
    <Pressable onPress={onPress} style={style}>
      {children}
    </Pressable>
  ) : (
    <View style={style}>{children}</View>
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

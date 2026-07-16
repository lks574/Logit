import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { DisclosureButton, Field } from '../../../components/Field';
import { Chip } from '../../../components/controls';
import { CompanionField, RatingInput } from '../../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { DateTimeField, nowDateISO, nowTimeLabel } from '../../../components/DateTimeField';
import { PrefillBanner } from '../../../components/PrefillBanner';
import { choosePhoto, photoUri } from '../../../lib/photos';
import { recentValues } from '../../../lib/history';
import { ClimbRoute, CLIMB_STYLES, emptyRoute, parseRoutes, cleanRoutes, climbSummary } from '../../../lib/climbing';
import { activityLabel } from '../../../data/activities';
import { resetToHome } from '../../../navigation/nav';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { tr } from '../../../i18n/i18n';

// 클라이밍 전용 폼 — setrep 템플릿(strength 색)을 공유하되 헬스와 다른 모델.
// 스타일(볼더링/리드/톱로프) · 루트 목록(그레이드·완등·시도) · 완등 요약 · 세부(장소·동행·사진·메모).

export default function ClimbingForm({ activity, recordId, plan, initialDate }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan; initialDate?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, records, completePlan } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? initialDate ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? plan?.timeLabel ?? nowTimeLabel());
  const [style, setStyle] = React.useState(record?.fields?.스타일 ?? CLIMB_STYLES[0]);
  const [routes, setRoutes] = React.useState<ClimbRoute[]>(() => parseRoutes(record?.fields));
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [place, setPlace] = React.useState(record?.fields?.장소 ?? plan?.place ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [open, setOpen] = React.useState(editing);

  const c0 = { color: c.strength, soft: c.strengthSoft };
  const { total, sent } = climbSummary(routes);

  const lastRecord = React.useMemo(
    () => records.find((r) => r.activity === activity && r.id !== recordId),
    [records, activity, recordId],
  );
  const recentPlaces = React.useMemo(() => recentValues(records, '장소', { excludeId: recordId }), [records, recordId]);
  const prefillFromLast = () => {
    if (!lastRecord) return;
    const f = lastRecord.fields ?? {};
    if (f.스타일) setStyle(f.스타일);
    if (f.장소) setPlace(f.장소);
  };

  const addRoute = () => setRoutes((r) => [...r, emptyRoute()]);
  const removeRoute = (i: number) => setRoutes((r) => r.filter((_, idx) => idx !== i));
  const setGrade = (i: number, v: string) => setRoutes((r) => r.map((x, idx) => (idx === i ? { ...x, grade: v } : x)));
  const setAttempts = (i: number, v: string) => setRoutes((r) => r.map((x, idx) => (idx === i ? { ...x, attempts: v } : x)));
  const toggleSent = (i: number) => setRoutes((r) => r.map((x, idx) => (idx === i ? { ...x, sent: !x.sent } : x)));

  const pickPhoto = async () => {
    const uris = await choosePhoto();
    if (uris.length) setPhotos((p) => [...p, ...uris]);
  };

  const handleSave = () => {
    const cleaned = cleanRoutes(routes);
    if (cleaned.length === 0) {
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Add at least one route (grade).', ko: '루트를 하나 이상 입력해 주세요(그레이드).' }),
      );
      return;
    }
    const fields: Record<string, string> = {
      스타일: style,
      루트: JSON.stringify(cleaned),
      ...(place.trim() ? { 장소: place.trim() } : {}),
    };
    const meta = [style, tr({ en: `sent ${sent}/${total}`, ko: `완등 ${sent}/${total}` }), place.trim()].filter(Boolean).join(' · ');
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
    if (editing) {
      updateRecord(recordId!, payload);
      nav.goBack();
    } else {
      addRecord(payload);
      if (plan) completePlan(plan.id);
      resetToHome(nav);
    }
  };

  const styleLabelEn: Record<string, string> = { 볼더링: 'Bouldering', 리드: 'Lead', 톱로프: 'Top rope' };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activityLabel(activity)}
        icon={<Icon.climbing size={13} color={c.strength} strokeWidth={2.2} />}
        color={c.strength}
        soft={c.strengthSoft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 14 }}>
        <DateTimeField dateISO={dateISO} timeLabel={timeLabel} onChangeDate={setDateISO} onChangeTime={setTimeLabel} color={c.strength} />

        {!editing && lastRecord ? <PrefillBanner activity={activity} onPress={prefillFromLast} /> : null}

        {/* 스타일 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 8 }}>{tr({ en: 'Style', ko: '스타일' })}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {CLIMB_STYLES.map((s) => (
              <Chip key={s} label={tr({ en: styleLabelEn[s], ko: s })} selected={s === style} color={c.strength} onPress={() => setStyle(s)} />
            ))}
          </View>
        </View>

        {/* 루트 목록 */}
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14 }}>
            <Text style={{ width: 30, fontSize: 11, fontWeight: '600', color: c.text3 }}>#</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Grade', ko: '그레이드' })}</Text>
            <Text style={{ width: 70, fontSize: 11, fontWeight: '600', color: c.text3, textAlign: 'center' }}>{tr({ en: 'Attempts', ko: '시도' })}</Text>
            <Text style={{ width: 56, fontSize: 11, fontWeight: '600', color: c.text3, textAlign: 'center' }}>{tr({ en: 'Sent', ko: '완등' })}</Text>
            <View style={{ width: 26 }} />
          </View>

          {routes.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: c.border }}>
              <Text style={{ width: 30, fontSize: 13, color: c.text2 }}>{i + 1}</Text>
              <TextInput
                value={r.grade}
                onChangeText={(v) => setGrade(i, v)}
                placeholder={tr({ en: 'e.g. V4 / 5.11a', ko: '예: V4 / 5.11a' })}
                placeholderTextColor={c.text3}
                style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text, paddingVertical: 12, paddingHorizontal: 0 }}
              />
              <TextInput
                value={r.attempts}
                onChangeText={(v) => setAttempts(i, v.replace(/[^\d]/g, ''))}
                placeholder="1"
                placeholderTextColor={c.text3}
                keyboardType="number-pad"
                style={{ width: 70, fontSize: 14, fontWeight: '600', color: c.text, paddingVertical: 12, textAlign: 'center' }}
              />
              <View style={{ width: 56, alignItems: 'center' }}>
                <Pressable
                  onPress={() => toggleSent(i)}
                  hitSlop={8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: r.sent }}
                  accessibilityLabel={tr({ en: 'Sent', ko: '완등' })}
                  style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: r.sent ? c.strength : c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
                >
                  {r.sent ? <Icon.check size={15} color="#fff" strokeWidth={2.6} /> : null}
                </Pressable>
              </View>
              <View style={{ width: 26, alignItems: 'flex-end' }}>
                {routes.length > 1 ? (
                  <Pressable onPress={() => removeRoute(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr({ en: 'Remove route', ko: '루트 삭제' })}>
                    <Glyph size={15} color={c.text3} strokeWidth={2}><Path d="M5 12h14" /></Glyph>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}

          <Pressable onPress={addRoute} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderTopWidth: 1, borderTopColor: c.border }}>
            <Icon.plus size={15} color={c.strength} strokeWidth={2.4} />
            <Text style={{ color: c.strength, fontSize: 13, fontWeight: '600' }}>{tr({ en: 'Add route', ko: '루트 추가' })}</Text>
          </Pressable>
        </View>

        {/* 완등 요약 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.strengthSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: c.text2 }}>{tr({ en: 'Sent', ko: '완등' })} <Text style={{ fontSize: 10, fontWeight: '600', color: c.strength }}>{tr({ en: 'Auto', ko: '자동' })}</Text></Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
              {sent}<Text style={{ fontSize: 13, color: c.text2 }}> / {total}</Text>
            </Text>
          </View>
        </View>

        {/* 평점 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Rating', ko: '평점' })}</Text>
          <RatingInput value={rating} onChange={setRating} size={22} />
        </View>

        {/* 세부 입력 */}
        <DisclosureButton
          title={tr({ en: 'More details', ko: '세부 입력' })}
          badge={tr({ en: 'Optional', ko: '선택' })}
          subtitle={tr({ en: 'Place · Companions · Photos · Memo', ko: '장소 · 동행 · 사진 · 메모' })}
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />
        {open ? (
          <View style={{ gap: 14 }}>
            <View>
              <Field label={tr({ en: 'Place', ko: '장소' })} value={place} onChangeText={setPlace} placeholder={tr({ en: 'e.g. The Climb', ko: '예: 더클라임' })} />
              {recentPlaces.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                  {recentPlaces.map((p) => (
                    <Pressable key={p} onPress={() => setPlace(p)} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 7, paddingVertical: 5, paddingHorizontal: 9 }}>
                      <Text style={{ fontSize: 12, color: c.text2 }}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Companions', ko: '동행' })}</Text>
              <CompanionField companions={companions} onChange={setCompanions} />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Photos', ko: '사진' })}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {photos.map((uri) => (
                  <View key={uri} style={{ width: 60, height: 60 }}>
                    <Image source={{ uri: photoUri(uri) }} style={{ width: 60, height: 60, borderRadius: 11 }} />
                    <Pressable onPress={() => setPhotos((p) => p.filter((u) => u !== uri))} hitSlop={6} accessibilityRole="button" accessibilityLabel={tr({ en: 'Delete photo', ko: '사진 삭제' })} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: c.text, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bg }}>
                      <Glyph size={9} color={c.bg} strokeWidth={2.8}><Path d="M6 6l12 12M18 6l-12 12" /></Glyph>
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={pickPhoto} style={{ width: 60, height: 60, borderRadius: 11, backgroundColor: c.surfaceAlt, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Glyph size={20} color={c.text3} strokeWidth={2}><Rect x="3" y="5" width="18" height="15" rx="3" /><Path d="M3 16l5-4 4 3 3-2 6 4" /><Path d="M9 10 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0" /></Glyph>
                </Pressable>
              </View>
            </View>
            <Field label={tr({ en: 'Memo', ko: '메모' })} value={memo} onChangeText={setMemo} placeholder={tr({ en: 'Memo', ko: '메모' })} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

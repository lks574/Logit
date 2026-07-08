import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { DisclosureButton, Field } from '../../../components/Field';
import { Segmented } from '../../../components/controls';
import { RatingInput, CompanionField } from '../../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { DateTimeField, nowDateISO, nowTimeLabel } from '../../../components/DateTimeField';
import { activities, activityLabel } from '../../../data/activities';
import { resetToHome } from '../../../navigation/nav';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { tr } from '../../../i18n/i18n';

// FreeForm — 자유 기록형 catch-all (free template, accent color #3D5A80).
// Derived from the common skeleton (§02, HTML lines 296–437):
//   필수 = 날짜·시간 row · core = 시간(duration) + 강도(segmented) + 평점(RatingInput)
//   · 공통 세부 입력 disclosure · 메모 field · offline footer note.
// Supports EDIT mode: with a recordId param, prefills state from the stored record
// and saves via updateRecord.

type Intensity = 'low' | 'mid' | 'high';

const INTENSITY_LABEL: Record<Intensity, string> = { low: '낮음', mid: '보통', high: '높음' };
const LABEL_INTENSITY: Record<string, Intensity> = { 낮음: 'low', 보통: 'mid', 높음: 'high' };

export default function FreeForm({ activity, recordId, plan }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, customActivities, completePlan } = useStore();

  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // 독서는 자유 템플릿을 공유하지만 필드가 다르다: 책 제목 + 메모만(강도·세부 없음).
  const isBook = activity === '독서';
  // 여가·나들이(여행·맛집 등)는 시간·강도가 어울리지 않아 숨긴다(장소·동행·사진·평점·메모만).
  // 빌트인·커스텀 활동 모두 template === 'outing' 이면 적용.
  const templateOf =
    activities[activity]?.template ?? customActivities.find((a) => a.name === activity)?.template;
  const isOuting = !isBook && templateOf === 'outing';

  // PREFILL controlled state from the record when editing; start BLANK on create.
  // 날짜·시간: 편집이면 저장값, 신규면 현재 날짜/시각.
  const [dateISO, setDateISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? nowDateISO());
  const [timeLabel, setTimeLabel] = React.useState(record?.timeLabel ?? plan?.timeLabel ?? nowTimeLabel());
  const [title, setTitle] = React.useState(record?.fields?.['제목'] ?? '');
  const [duration, setDuration] = React.useState(record?.fields?.['시간']?.replace(/[^0-9]/g, '') ?? '');
  const [intensity, setIntensity] = React.useState<Intensity>(
    (record?.fields?.['강도'] && LABEL_INTENSITY[record.fields['강도']]) || 'mid',
  );
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [place, setPlace] = React.useState(record?.fields?.['장소'] ?? plan?.place ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [open, setOpen] = React.useState(
    isOuting || !!(record?.companions?.length || record?.photos?.length || record?.fields?.['장소']),
  );

  const durationRef = React.useRef<TextInput>(null);

  const pickPhoto = async () => {
    const uris = await choosePhoto();
    if (uris.length) setPhotos((p) => [...p, ...uris]);
  };

  const handleSave = () => {
    if (isBook) {
      if (title.trim() === '' && memo.trim() === '') {
        Alert.alert(
          tr({ en: 'Required', ko: '필수 항목' }),
          tr({ en: 'Enter a book title or memo.', ko: '책 제목이나 메모를 입력해 주세요.' }),
        );
        return;
      }
    } else if (isOuting) {
      if (place.trim() === '' && memo.trim() === '') {
        Alert.alert(
          tr({ en: 'Required', ko: '필수 항목' }),
          tr({ en: 'Enter a place or memo.', ko: '장소나 메모를 입력해 주세요.' }),
        );
        return;
      }
    } else if (duration.trim() === '' && memo.trim() === '') {
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Enter a time or memo.', ko: '시간이나 메모를 입력해 주세요.' }),
      );
      return;
    }
    const durTrim = duration.trim();
    const 시간 = durTrim ? `${durTrim}분` : '';
    const 강도 = INTENSITY_LABEL[intensity];
    const titleTrim = title.trim();
    const meta = isBook
      ? [titleTrim, 시간].filter(Boolean).join(' · ')
      : isOuting
        ? place
        : [시간, tr({ en: `Intensity ${강도}`, ko: `강도 ${강도}` })].filter(Boolean).join(' · ');
    const payload = {
      activity,
      template: (isOuting ? 'outing' : 'free') as 'outing' | 'free',
      dateISO,
      timeLabel,
      meta,
      rating,
      memo,
      companions,
      photos,
      fields: isBook
        ? {
            ...(titleTrim ? { 제목: titleTrim } : {}),
            ...(시간 ? { 시간 } : {}),
          }
        : isOuting
          ? {
              ...(place ? { 장소: place } : {}),
            }
          : {
              ...(시간 ? { 시간 } : {}),
              강도,
              ...(place ? { 장소: place } : {}),
            },
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
        icon={(() => {
          const Ico = activities[activity] ? Icon[activities[activity].icon] : Icon.yoga;
          return <Ico size={13} color={c.accent} strokeWidth={2.2} />;
        })()}
        color={c.accent}
        soft={c.accentSoft}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 필수 — 날짜 · 시간 (편집 가능) */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>
            {tr({ en: 'Required', ko: '필수' })}
          </Text>
          <DateTimeField
            dateISO={dateISO}
            timeLabel={timeLabel}
            onChangeDate={setDateISO}
            onChangeTime={setTimeLabel}
            color={c.accent}
          />
        </View>

        {/* 독서 — 책 제목 */}
        {isBook ? (
          <Field label={tr({ en: 'Book title', ko: '책 제목' })} value={title} onChangeText={setTitle} placeholder={tr({ en: 'e.g. Demian', ko: '예: 데미안' })} />
        ) : null}

        {/* core — 시간 (duration) — 독서·여가 제외 */}
        {!isBook && !isOuting ? (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Time', ko: '시간' })}</Text>
            <Pressable
              onPress={() => durationRef.current?.focus()}
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
              <TextInput
                ref={durationRef}
                value={duration}
                onChangeText={(t) => setDuration(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder={tr({ en: 'e.g. 45', ko: '예: 45' })}
                placeholderTextColor={c.text3}
                style={{ fontSize: 18, fontWeight: '700', color: c.text, padding: 0, minWidth: 56 }}
              />
              <Text style={{ fontSize: 13, color: c.text2 }}>{tr({ en: 'min', ko: '분' })}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* core — 강도 (segmented) — 독서·여가 제외 */}
        {!isBook && !isOuting ? (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Intensity', ko: '강도' })}</Text>
            <Segmented<Intensity>
              options={[
                { key: 'low', label: tr({ en: 'Low', ko: '낮음' }) },
                { key: 'mid', label: tr({ en: 'Medium', ko: '보통' }) },
                { key: 'high', label: tr({ en: 'High', ko: '높음' }) },
              ]}
              value={intensity}
              onChange={setIntensity}
              color={c.accent}
            />
          </View>
        ) : null}

        {/* core — 평점 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Rating', ko: '평점' })}</Text>
          <RatingInput value={rating} onChange={setRating} size={22} />
        </View>

        {/* 공통 세부 입력 (collapsed default) — 독서 제외 */}
        {!isBook ? (
          <DisclosureButton
            title={tr({ en: 'More details', ko: '세부 입력' })}
            badge={tr({ en: 'Optional', ko: '선택' })}
            subtitle={tr({ en: 'Place · Companions · Photos · Memo', ko: '장소 · 동행 · 사진 · 메모' })}
            icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
            open={open}
            onPress={() => setOpen((o) => !o)}
          />
        ) : null}

        {!isBook && open ? (
          <>
            {/* 장소 */}
            <Field label={tr({ en: 'Place', ko: '장소' })} value={place} onChangeText={setPlace} placeholder={tr({ en: 'Place', ko: '장소' })} />

            {/* 동행 */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Companions', ko: '동행' })}</Text>
              <CompanionField companions={companions} onChange={setCompanions} />
            </View>

            {/* 사진 */}
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
          </>
        ) : null}

        {/* 메모 */}
        <Field label={tr({ en: 'Memo', ko: '메모' })} value={memo} onChangeText={setMemo} placeholder={tr({ en: 'Memo', ko: '메모' })} />

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
          <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'Saved instantly, even offline', ko: '오프라인에서도 즉시 저장됩니다' })}</Text>
        </View>
      </View>
    </Screen>
  );
}

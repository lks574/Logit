import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { Field } from '../../../components/Field';
import { RatingInput, CompanionField } from '../../../components/Rating';
import { Glyph, Icon, Path, Rect } from '../../../components/Glyph';
import { MiniMonthPicker } from '../../../components/MiniMonthPicker';
import { nowDateISO } from '../../../components/DateTimeField';
import { monthDayWeekday } from '../../../lib/date';
import { activityLabel } from '../../../data/activities';
import { resetToHome } from '../../../navigation/nav';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';
import { tr } from '../../../i18n/i18n';

// 캠핑 전용 폼 — free 템플릿을 공유하지만 필드가 다르다:
//   시작일~마지막일(박 수 자동) · 도/시 + 캠핑장명 · 같이한 사람 · 평점 · 메모.
//   (시간·강도·세부입력은 없음)

const daysBetween = (startISO: string, endISO: string) => {
  const s = Date.parse(startISO + 'T00:00:00Z');
  const e = Date.parse(endISO + 'T00:00:00Z');
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / 86400000));
};

const nightsLabel = (nights: number) =>
  nights === 0
    ? tr({ en: 'Day trip', ko: '당일' })
    : tr({ en: `${nights} night${nights > 1 ? 's' : ''}`, ko: `${nights}박 ${nights + 1}일` });

export default function CampingForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [startISO, setStartISO] = React.useState(record?.dateISO ?? nowDateISO());
  const [endISO, setEndISO] = React.useState(record?.fields?.마지막일 ?? record?.dateISO ?? nowDateISO());
  const [region, setRegion] = React.useState(record?.fields?.지역 ?? '');
  const [camp, setCamp] = React.useState(record?.fields?.장소 ?? '');
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const [companions, setCompanions] = React.useState<string[]>(record?.companions ?? []);
  const [picking, setPicking] = React.useState<'start' | 'end' | null>(null);

  const nights = daysBetween(startISO, endISO);

  // 시작일 선택 시 마지막일이 그보다 앞이면 같이 당김.
  const onPickStart = (iso: string) => {
    setStartISO(iso);
    if (Date.parse(endISO + 'T00:00:00Z') < Date.parse(iso + 'T00:00:00Z')) setEndISO(iso);
    setPicking(null);
  };
  const onPickEnd = (iso: string) => {
    // 마지막일이 시작일보다 앞이면 시작일로 맞춘다.
    setEndISO(Date.parse(iso + 'T00:00:00Z') < Date.parse(startISO + 'T00:00:00Z') ? startISO : iso);
    setPicking(null);
  };

  const handleSave = () => {
    if (camp.trim() === '') {
      Alert.alert(
        tr({ en: 'Required', ko: '필수 항목' }),
        tr({ en: 'Enter the campground name.', ko: '캠핑장명을 입력해 주세요.' }),
      );
      return;
    }
    const period = nightsLabel(nights);
    const fields: Record<string, string> = {
      장소: camp.trim(),
      ...(region.trim() ? { 지역: region.trim() } : {}),
      마지막일: endISO,
      기간: period,
    };
    const payload = {
      activity,
      template: 'outing' as const,
      dateISO: startISO,
      timeLabel: '',
      meta: [period, camp.trim(), region.trim()].filter(Boolean).join(' · '),
      rating,
      memo,
      companions,
      photos: [] as string[],
      fields,
    };
    if (editing) {
      updateRecord(recordId!, payload);
      nav.goBack();
    } else {
      addRecord(payload);
      resetToHome(nav);
    }
  };

  const DateBox = ({ label, iso, which }: { label: string; iso: string; which: 'start' | 'end' }) => (
    <Pressable
      onPress={() => setPicking((p) => (p === which ? null : which))}
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: picking === which ? c.outing : c.border,
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 13,
      }}
    >
      <Text style={{ fontSize: 12, color: c.text2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 }}>
        <Glyph size={15} color={c.outing}>
          <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
          <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        </Glyph>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{monthDayWeekday(iso)}</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activityLabel(activity)}
        icon={<Icon.tent size={13} color={c.outing} strokeWidth={2.2} />}
        color={c.outing}
        soft={c.outingSoft}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 필수 — 기간(시작일 ~ 마지막일) */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>
            {tr({ en: 'Period', ko: '기간' })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DateBox label={tr({ en: 'Start', ko: '시작일' })} iso={startISO} which="start" />
            <Text style={{ fontSize: 14, color: c.text3 }}>~</Text>
            <DateBox label={tr({ en: 'End', ko: '마지막일' })} iso={endISO} which="end" />
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.outingSoft, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginTop: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.outing }}>{nightsLabel(nights)}</Text>
          </View>
          {picking === 'start' ? <MiniMonthPicker value={startISO} onChange={onPickStart} /> : null}
          {picking === 'end' ? <MiniMonthPicker value={endISO} onChange={onPickEnd} /> : null}
        </View>

        {/* 장소 — 도/시 + 캠핑장명 */}
        <Field
          label={tr({ en: 'Region (province · city)', ko: '지역 (도·시)' })}
          value={region}
          onChangeText={setRegion}
          placeholder={tr({ en: 'e.g. Gangwon · Chuncheon', ko: '예: 강원도 · 춘천시' })}
        />
        <Field
          label={tr({ en: 'Campground', ko: '캠핑장명' })}
          value={camp}
          onChangeText={setCamp}
          placeholder={tr({ en: 'e.g. Jarasum Camping', ko: '예: 자라섬 오토캠핑장' })}
        />

        {/* 같이한 사람 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Companions', ko: '같이한 사람' })}</Text>
          <CompanionField companions={companions} onChange={setCompanions} />
        </View>

        {/* 평점 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Rating', ko: '평점' })}</Text>
          <RatingInput value={rating} onChange={setRating} size={22} />
        </View>

        {/* 메모 */}
        <Field label={tr({ en: 'Memo', ko: '메모' })} value={memo} onChangeText={setMemo} placeholder={tr({ en: 'Memo', ko: '메모' })} />

        {/* offline footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 6 }}>
          <Icon.check size={14} color={c.text3} strokeWidth={2} />
          <Text style={{ fontSize: 12, color: c.text3 }}>{tr({ en: 'Saved instantly, even offline', ko: '오프라인에서도 즉시 저장됩니다' })}</Text>
        </View>
      </View>
    </Screen>
  );
}

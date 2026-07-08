import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { Field } from '../../../components/Field';
import { RatingInput } from '../../../components/Rating';
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

// 떠나는 날/돌아오는 날 박스. 컴포넌트 밖에 정의해 매 렌더 재생성(리마운트)에 따른 터치 리스폰더 불안정을 막는다.
function DateBox({ label, iso, active, onPress, c }: { label: string; iso: string; active: boolean; onPress: () => void; c: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: active ? c.outing : c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}
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
}

export default function CampingForm({ activity, recordId, plan }: { activity: string; recordId?: string; plan?: import('../../../store/types').StoredPlan }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, records, completePlan } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  const [startISO, setStartISO] = React.useState(record?.dateISO ?? plan?.dateISO ?? nowDateISO());
  const [endISO, setEndISO] = React.useState(record?.fields?.마지막일 ?? record?.dateISO ?? plan?.dateISO ?? nowDateISO());
  const [region, setRegion] = React.useState(record?.fields?.지역 ?? '');
  const [camp, setCamp] = React.useState(record?.fields?.장소 ?? plan?.place ?? '');
  const [tags, setTags] = React.useState(record?.fields?.분류 ?? '');
  const [rating, setRating] = React.useState(record?.rating ?? 0);
  const [memo, setMemo] = React.useState(record?.memo ?? plan?.memo ?? '');
  const [picking, setPicking] = React.useState<'start' | 'end' | null>(null);

  // 재방문 힌트 — 같은 장소(캠핑장/맛집/방문지)를 전에 기록했는지(자기 자신 제외).
  const priorVisits = React.useMemo(() => {
    const name = camp.trim();
    if (!name) return 0;
    return records.filter((r) => r.template === 'outing' && r.id !== recordId && (r.fields?.장소 ?? '').trim() === name).length;
  }, [camp, records, recordId]);

  const nights = daysBetween(startISO, endISO);

  // 떠나는 날을 바꾸면 돌아오는 날도 같은 날짜로 맞춘다(당일치기 기본).
  const onPickStart = (iso: string) => {
    setStartISO(iso);
    setEndISO(iso);
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
      ...(tags.trim() ? { 분류: tags.trim() } : {}),
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
      photos: [] as string[],
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
            <DateBox label={tr({ en: 'Depart', ko: '떠나는 날' })} iso={startISO} active={picking === 'start'} onPress={() => setPicking((p) => (p === 'start' ? null : 'start'))} c={c} />
            <Text style={{ fontSize: 14, color: c.text3 }}>~</Text>
            <DateBox label={tr({ en: 'Return', ko: '돌아오는 날' })} iso={endISO} active={picking === 'end'} onPress={() => setPicking((p) => (p === 'end' ? null : 'end'))} c={c} />
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.outingSoft, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginTop: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.outing }}>{nightsLabel(nights)}</Text>
          </View>
          {picking === 'start' ? <MiniMonthPicker value={startISO} onChange={onPickStart} /> : null}
          {picking === 'end' ? <MiniMonthPicker value={endISO} onChange={onPickEnd} /> : null}
        </View>

        {/* 평점 — (지역이 있던 자리) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>{tr({ en: 'Rating', ko: '평점' })}</Text>
          <RatingInput value={rating} onChange={setRating} size={22} />
        </View>

        {/* 캠핑장명 */}
        <View>
          <Field
            label={tr({ en: 'Campground', ko: '캠핑장명' })}
            value={camp}
            onChangeText={setCamp}
            placeholder={tr({ en: 'e.g. Jarasum Camping', ko: '예: 자라섬 오토캠핑장' })}
          />
          {priorVisits > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 2 }}>
              <Icon.tent size={12} color={c.outing} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.outing }}>
                {tr({ en: `Been here before · visit #${priorVisits + 1}`, ko: `전에 왔던 곳 · ${priorVisits + 1}번째` })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 지역 — (동행이 있던 자리) */}
        <Field
          label={tr({ en: 'Region (province · city)', ko: '지역 (도·시)' })}
          value={region}
          onChangeText={setRegion}
          placeholder={tr({ en: 'e.g. Gangwon · Chuncheon', ko: '예: 강원도 · 춘천시' })}
        />

        {/* 분류 — 태그(쉼표 구분) */}
        <Field
          label={tr({ en: 'Tags', ko: '분류' })}
          value={tags}
          onChangeText={setTags}
          placeholder={tr({ en: 'e.g. Valley, National, Sea view', ko: '예: 계곡, 국가, 바닷가' })}
        />

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

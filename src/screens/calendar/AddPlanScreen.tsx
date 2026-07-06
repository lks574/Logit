import React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/primitives';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconButton } from '../../components/Button';
import { Toggle, Segmented } from '../../components/controls';
import { Icon, Glyph, Path, Circle, Rect } from '../../components/Glyph';
import { MiniMonthPicker } from '../../components/MiniMonthPicker';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { activities, colorsFor, iconFor } from '../../data/activities';
import { RootStackParamList } from '../../navigation/types';
import { TemplateType, withAlpha } from '../../theme/tokens';
import { tr } from '../../i18n/i18n';
import { activityLabel } from '../../data/activities';

const FAVORITES = ['헬스', '런닝', '축구']; // quick chips; "…" reveals all

// "2026-07-02" → "7월 2일 (수)".
const dateLabel = (iso: string) => {
  const wd = [
    tr({ en: 'Sun', ko: '일' }),
    tr({ en: 'Mon', ko: '월' }),
    tr({ en: 'Tue', ko: '화' }),
    tr({ en: 'Wed', ko: '수' }),
    tr({ en: 'Thu', ko: '목' }),
    tr({ en: 'Fri', ko: '금' }),
    tr({ en: 'Sat', ko: '토' }),
  ][new Date(iso + 'T00:00:00Z').getUTCDay()];
  const mo = +iso.slice(5, 7);
  const day = +iso.slice(8, 10);
  return tr({ en: `${mo}/${day} (${wd})`, ko: `${mo}월 ${day}일 (${wd})` });
};
// "오후 8:00" → { ampm, h12, minute }.
const parseTime = (label?: string) => {
  const m = label?.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!m) return { ampm: '오후' as '오전' | '오후', h12: 3, minute: 0 };
  return { ampm: m[1] as '오전' | '오후', h12: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
};
const timeLabelOf = (ampm: string, h12: number, minute: number) =>
  `${ampm} ${h12}:${String(minute).padStart(2, '0')}`;
// 표시용: 저장 포맷(오전/오후)의 시간 라벨을 현재 언어로 렌더.
const timeLabelDisplay = (ampm: '오전' | '오후', h12: number, minute: number) => {
  const mm = String(minute).padStart(2, '0');
  const period = ampm === '오전' ? tr({ en: 'AM', ko: '오전' }) : tr({ en: 'PM', ko: '오후' });
  return tr({ en: `${period} ${h12}:${mm}`, ko: `${period} ${h12}:${mm}` });
};

export default function AddPlanScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AddPlan'>>();
  const planId = params?.planId;
  const { addPlan, updatePlan, deletePlan, getPlan, customActivities, today } = useStore();
  const editing = !!planId;
  const plan = planId ? getPlan(planId) : undefined;

  const templateOf = (name: string): TemplateType =>
    activities[name]?.template ?? customActivities.find((a) => a.name === name)?.template ?? 'free';

  // ---- state (prefilled in edit mode) ----
  const [act, setAct] = React.useState<string>(plan?.activity ?? FAVORITES[0]);
  const [showAll, setShowAll] = React.useState(false);
  const [dateISO, setDateISO] = React.useState<string>(plan?.dateISO ?? params?.dateISO ?? today);
  // 시간 초기값: 편집이면 저장된 시간, 신규면 현재 시각. 시간은 옵셔널(미정 가능).
  const now = React.useMemo(() => new Date(), []);
  const initTime = plan?.timeLabel
    ? parseTime(plan.timeLabel)
    : {
        ampm: (now.getHours() < 12 ? '오전' : '오후') as '오전' | '오후',
        h12: ((now.getHours() + 11) % 12) + 1,
        minute: now.getMinutes(),
      };
  const [hasTime, setHasTime] = React.useState(editing ? !!plan?.timeLabel : true);
  const [ampm, setAmpm] = React.useState<'오전' | '오후'>(initTime.ampm);
  const [h12, setH12] = React.useState(initTime.h12);
  const [minute, setMinute] = React.useState(initTime.minute);
  const [place, setPlace] = React.useState(plan?.place ?? '');
  const [memo, setMemo] = React.useState(plan?.memo ?? '');
  const [alarm, setAlarm] = React.useState(plan?.reminder ?? true);
  const [showDate, setShowDate] = React.useState(false);
  const [showTime, setShowTime] = React.useState(false);

  const allNames = [
    ...Object.keys(activities),
    ...customActivities.map((a) => a.name).filter((n) => !activities[n]),
  ];

  const onSave = () => {
    const payload = {
      activity: act,
      template: templateOf(act),
      dateISO,
      timeLabel: hasTime ? timeLabelOf(ampm, h12, minute) : undefined,
      place: place.trim() || undefined,
      memo: memo.trim() || undefined,
      reminder: hasTime ? alarm : false,
    };
    if (editing && planId) updatePlan(planId, payload);
    else addPlan(payload);
    nav.goBack();
  };
  const onDelete = () => {
    if (!planId) {
      nav.goBack();
      return;
    }
    Alert.alert(tr({ en: 'Delete plan', ko: '약속 삭제' }), tr({ en: 'Delete this plan?', ko: '이 약속을 삭제할까요?' }), [
      { text: tr({ en: 'Cancel', ko: '취소' }), style: 'cancel' },
      {
        text: tr({ en: 'Delete', ko: '삭제' }),
        style: 'destructive',
        onPress: () => {
          deletePlan(planId);
          nav.goBack();
        },
      },
    ]);
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{children}</Text>
  );

  // Activity tile (used in quick row + show-all grid).
  const ActTile = ({ name, wide }: { name: string; wide?: boolean }) => {
    const tmpl = templateOf(name);
    const { color, soft } = colorsFor(tmpl, c);
    const IconCmp = iconFor(name);
    const active = act === name;
    return (
      <Pressable
        onPress={() => setAct(name)}
        style={{
          flex: wide ? 1 : undefined,
          minWidth: wide ? undefined : 92,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          borderRadius: 12,
          paddingVertical: 9,
          paddingHorizontal: 10,
          backgroundColor: active ? soft : c.surface,
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? color : c.border,
        }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: active ? c.surface : soft, alignItems: 'center', justifyContent: 'center' }}>
          <IconCmp size={15} color={color} />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: active ? c.text : c.text2 }}>{activityLabel(name)}</Text>
      </Pressable>
    );
  };

  // Inline ± stepper (wraps).
  const Wheel = ({ value, onDec, onInc }: { value: string; onDec: () => void; onInc: () => void }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onDec} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: c.text2 }}>−</Text>
      </Pressable>
      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text, minWidth: 34, textAlign: 'center' }}>{value}</Text>
      <Pressable onPress={onInc} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: c.text2 }}>＋</Text>
      </Pressable>
    </View>
  );

  const fieldBox = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 9,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
  };

  return (
    <Screen edges={['top', 'bottom']} scroll>
      {/* header */}
      <ScreenHeader
        title={editing ? tr({ en: 'Plan', ko: '약속' }) : tr({ en: 'Add plan', ko: '약속 추가' })}
        style={{ paddingTop: 6 }}
        right={
          editing ? (
            <>
              <IconButton size={30} bg={c.accentSoft} label={tr({ en: 'Save', ko: '저장' })} onPress={onSave}>
                <Icon.check size={16} color={c.accent} strokeWidth={2.4} />
              </IconButton>
              <IconButton size={30} bg={withAlpha(c.error, 12)} label={tr({ en: 'Delete', ko: '삭제' })} onPress={onDelete}>
                <Icon.trash size={16} color={c.error} strokeWidth={2} />
              </IconButton>
            </>
          ) : (
            <Pressable onPress={onSave} hitSlop={8} style={{ height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent }}>{tr({ en: 'Save', ko: '저장' })}</Text>
            </Pressable>
          )
        }
      />

      <View style={{ paddingHorizontal: 18, paddingTop: 2, gap: 16, paddingBottom: 24 }}>
        {/* 활동 */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{tr({ en: 'Activity', ko: '활동' })}</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FAVORITES.map((n) => (
              <ActTile key={n} name={n} wide />
            ))}
            <Pressable
              onPress={() => setShowAll((s) => !s)}
              hitSlop={4}
              style={{ width: 46, borderRadius: 12, backgroundColor: showAll ? c.accentSoft : c.surface, borderWidth: 1, borderColor: showAll ? c.accent : c.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Glyph size={18} color={showAll ? c.accent : c.text3}>
                <Circle cx="5" cy="12" r="1.6" />
                <Circle cx="12" cy="12" r="1.6" />
                <Circle cx="19" cy="12" r="1.6" />
              </Glyph>
            </Pressable>
          </View>
          {showAll ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
              {allNames.map((n) => (
                <ActTile key={n} name={n} />
              ))}
            </View>
          ) : null}
        </View>

        {/* 날짜 · 시간 */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{tr({ en: 'Date · Time', ko: '날짜 · 시간' })}</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[fieldBox, { flex: 1.4 }]} onPress={() => { setShowDate((s) => !s); setShowTime(false); }}>
              <Glyph size={17} color={c.accent}>
                <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
              </Glyph>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{dateLabel(dateISO)}</Text>
            </Pressable>
            <Pressable
              style={[fieldBox, { flex: 1 }]}
              onPress={() => {
                if (!hasTime) {
                  setHasTime(true);
                  setShowTime(true);
                  setShowDate(false);
                } else {
                  setShowTime((s) => !s);
                  setShowDate(false);
                }
              }}
            >
              <Glyph size={17} color={hasTime ? c.accent : c.text3}>
                <Circle cx="12" cy="12" r="9" />
                <Path d="M12 7v5l3.5 2" />
              </Glyph>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: hasTime ? c.text : c.text3 }}>
                {hasTime ? timeLabelDisplay(ampm, h12, minute) : tr({ en: 'No time', ko: '시간 미정' })}
              </Text>
              {hasTime ? (
                <Pressable
                  onPress={() => { setHasTime(false); setShowTime(false); }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={tr({ en: 'Clear time', ko: '시간 지우기' })}
                >
                  <Glyph size={15} color={c.text3} strokeWidth={2.4}>
                    <Path d="M6 6l12 12M18 6l-12 12" />
                  </Glyph>
                </Pressable>
              ) : null}
            </Pressable>
          </View>

          {showDate ? (
            <MiniMonthPicker value={dateISO} onChange={(iso) => { setDateISO(iso); setShowDate(false); }} />
          ) : null}

          {showTime && hasTime ? (
            <View style={{ gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, marginTop: 8 }}>
              <Segmented
                options={[{ key: '오전', label: tr({ en: 'AM', ko: '오전' }) }, { key: '오후', label: tr({ en: 'PM', ko: '오후' }) }]}
                value={ampm}
                onChange={(v) => setAmpm(v as '오전' | '오후')}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                <Wheel value={tr({ en: `${h12}h`, ko: `${h12}시` })} onDec={() => setH12((h) => (h === 1 ? 12 : h - 1))} onInc={() => setH12((h) => (h === 12 ? 1 : h + 1))} />
                <Wheel value={tr({ en: `${String(minute).padStart(2, '0')}m`, ko: `${String(minute).padStart(2, '0')}분` })} onDec={() => setMinute((m) => (m + 55) % 60)} onInc={() => setMinute((m) => (m + 5) % 60)} />
              </View>
            </View>
          ) : null}
        </View>

        {/* 장소 */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{tr({ en: 'Place', ko: '장소' })}</SectionLabel>
          <View style={fieldBox}>
            <Glyph size={17} color={c.text3}>
              <Path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
              <Circle cx="12" cy="10" r="2.5" />
            </Glyph>
            <TextInput
              value={place}
              onChangeText={setPlace}
              placeholder={tr({ en: 'Enter place', ko: '장소 입력' })}
              placeholderTextColor={c.text3}
              style={{ flex: 1, fontSize: 14, color: c.text, padding: 0 }}
            />
          </View>
        </View>

        {/* 메모 */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>
            {tr({ en: 'Memo', ko: '메모' })} <Text style={{ color: c.text3, fontWeight: '500' }}>{tr({ en: '· optional', ko: '· 선택' })}</Text>
          </Text>
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 13, minHeight: 52 }}>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder={tr({ en: 'Bring futsal shoes, 2 water bottles', ko: '풋살화 챙기기, 물 2병' })}
              placeholderTextColor={c.text3}
              multiline
              style={{ fontSize: 13.5, color: c.text, padding: 0, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {/* 알림 — 시간 미정이면 비활성(알림 기준 시각이 없음) */}
        <View style={[fieldBox, { justifyContent: 'space-between', paddingHorizontal: 14, opacity: hasTime ? 1 : 0.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Glyph size={17} color={c.text2}>
              <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.5 21a1.7 1.7 0 0 1-3 0" />
            </Glyph>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{tr({ en: 'Reminder', ko: '알림' })}</Text>
              <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{hasTime ? tr({ en: '1 hour before', ko: '1시간 전' }) : tr({ en: 'No reminder without a time', ko: '시간 미정 시 알림 없음' })}</Text>
            </View>
          </View>
          <Toggle value={hasTime && alarm} onChange={hasTime ? setAlarm : undefined} />
        </View>

        {/* 신규 추가에만 하단 CTA */}
        {!editing ? (
          <Pressable
            onPress={onSave}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, marginTop: 4, opacity: pressed ? 0.9 : 1 })}
          >
            <Glyph size={18} color="#fff" strokeWidth={2.4}>
              <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
              <Path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 14l2 2 4-4" />
            </Glyph>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{tr({ en: 'Save plan', ko: '약속 저장' })}</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton } from '../../components/Field';
import { Segmented, Chip } from '../../components/controls';
import { RatingInput } from '../../components/Rating';
import { Glyph, Path, Rect, Icon, IconName } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';

// 3.3 MatchForm — 대전·경기형 (team color). Sport-agnostic: the 종목 chip drives
// the swappable "종목별 핵심 기록" slots, the score card, and the 결과 segment.
// 개인전(승/패) vs 팀전(승/무/패). Copy: Logit.dc.html lines 557–617.

type Slot = { label: string; value: string };

type Sport = {
  key: string;
  label: string;
  icon: IconName;
  team?: boolean; // team sport → 승/무/패, 우리/상대 라벨
  meLabel: string;
  oppLabel: string;
  meName: string;
  oppName: string;
  score: [string, string];
  gameScore?: string; // 라켓 종목만; 팀 종목은 스코어 카드로 충분해 생략
  slots: [Slot, Slot]; // 종목별 핵심 기록 — swappable template slots
};

// Sport registry — each 종목 carries its own score card, game score, and
// key-record slots. Selecting a chip (or entering via an activity) swaps them all.
// No hardcoded soccer↔baseball toggle.
const SPORTS: Sport[] = [
  { key: 'badminton', label: '배드민턴', icon: 'badminton', meLabel: '나', oppLabel: '상대', meName: '민준', oppName: '지현', score: ['2', '1'], gameScore: '21-18 · 19-21 · 21-15', slots: [{ label: '최장 랠리', value: '32' }, { label: '에이스', value: '5' }] },
  { key: 'tennis', label: '테니스', icon: 'tennis', meLabel: '나', oppLabel: '상대', meName: '민준', oppName: '지현', score: ['2', '0'], gameScore: '6-4 · 6-3', slots: [{ label: '에이스', value: '7' }, { label: '더블폴트', value: '3' }] },
  { key: 'pingpong', label: '탁구', icon: 'pingpong', meLabel: '나', oppLabel: '상대', meName: '민준', oppName: '지현', score: ['3', '1'], gameScore: '11-8 · 9-11 · 11-6 · 11-7', slots: [{ label: '최장 랠리', value: '18' }, { label: '서브 득점', value: '9' }] },
  { key: 'soccer', label: '축구', icon: 'soccer', team: true, meLabel: '우리', oppLabel: '상대', meName: 'FC 번개', oppName: '조기축구회', score: ['3', '1'], slots: [{ label: '골', value: '2' }, { label: '어시스트', value: '1' }] },
  { key: 'baseball', label: '야구', icon: 'baseball', team: true, meLabel: '우리', oppLabel: '상대', meName: '블루윙즈', oppName: '레드삭스', score: ['5', '3'], slots: [{ label: '안타', value: '3' }, { label: '타점', value: '2' }] },
  { key: 'jiujitsu', label: '주짓수', icon: 'jiujitsu', meLabel: '나', oppLabel: '상대', meName: '민준', oppName: '상대 선수', score: ['1', '0'], gameScore: '어드밴티지 2-1', slots: [{ label: '서브미션', value: '1' }, { label: '스윕', value: '3' }] },
];

// 활동 이름 → 종목 key (entry sport). 미매칭 시 첫 종목.
const ACTIVITY_TO_SPORT: Record<string, string> = {
  축구: 'soccer', 야구: 'baseball', 배드민턴: 'badminton', 테니스: 'tennis', 탁구: 'pingpong', 주짓수: 'jiujitsu',
};

export default function MatchForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, today } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // 종목: 편집 시 record.activity → 종목 key, 아니면 진입 활동명 기준.
  const [sportKey, setSportKey] = React.useState(
    ACTIVITY_TO_SPORT[record?.activity ?? activity] ?? ACTIVITY_TO_SPORT[activity] ?? SPORTS[0].key,
  );
  const [open, setOpen] = React.useState(editing); // 세부 입력 disclosure (open when editing)
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [rating, setRating] = React.useState(editing ? record?.rating ?? 0 : 0);
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const sport = SPORTS.find((s) => s.key === sportKey) ?? SPORTS[0];

  // 스코어 카드 값 — CREATE는 공백(placeholder), EDIT는 record.fields.스코어("a:b") 파싱.
  const editScore = editing ? (record?.fields?.스코어 ?? '').split(':') : [];
  const [meScore, setMeScore] = React.useState(editScore[0]?.trim() ?? '');
  const [oppScore, setOppScore] = React.useState(editScore[1]?.trim() ?? '');
  // 이름 — CREATE는 공백(placeholder), EDIT는 저장된 값(record.fields) 있으면 사용, 없으면 종목 기본값.
  const [meName, setMeName] = React.useState(editing ? record?.fields?.나 ?? sport.meName : '');
  const [oppName, setOppName] = React.useState(editing ? record?.fields?.상대 ?? sport.oppName : '');
  // 종목별 핵심 기록 슬롯 값 — CREATE는 공백, EDIT는 슬롯 라벨과 일치하는 record.fields 값.
  const [slotValues, setSlotValues] = React.useState<Record<string, string>>(() =>
    editing
      ? Object.fromEntries(sport.slots.map((s) => [s.label, record?.fields?.[s.label] ?? '']))
      : {},
  );
  const setSlotValue = (label: string, value: string) =>
    setSlotValues((prev) => ({ ...prev, [label]: value }));

  const resultOptions = sport.team
    ? [
        { key: 'win', label: '승' },
        { key: 'draw', label: '무' },
        { key: 'loss', label: '패' },
      ]
    : [
        { key: 'win', label: '승' },
        { key: 'loss', label: '패' },
      ];
  // 결과: record.fields.결과 라벨(승/무/패) → segment key.
  const resultFromLabel = (label?: string) =>
    label === '무' ? 'draw' : label === '패' ? 'loss' : label === '승' ? 'win' : undefined;
  const [result, setResult] = React.useState<string>(resultFromLabel(record?.fields?.결과) ?? 'win');

  // 종목 전환 시 현재 결과가 새 옵션에 없으면(예: 팀→개인 전환 시 '무') '승'으로 리셋.
  const selectSport = (key: string) => {
    setSportKey(key);
    const next = SPORTS.find((s) => s.key === key);
    if (next && !next.team && result === 'draw') setResult('win');
  };

  const iconFor = (key: string) => {
    const s = SPORTS.find((sp) => sp.key === key) ?? SPORTS[0];
    const Cmp = Icon[s.icon];
    return <Cmp size={13} color={c.team} strokeWidth={2.2} />;
  };

  const sectionLabel = (text: string) => (
    <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>{text}</Text>
  );

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const handleSave = () => {
    const resultLabel = resultOptions.find((o) => o.key === result)?.label ?? '승';
    const hasScore = meScore.trim() !== '' || oppScore.trim() !== '';
    const score = hasScore ? `${meScore.trim() || '0'}:${oppScore.trim() || '0'}` : '';
    const meNameOut = meName.trim();
    const oppNameOut = oppName.trim();

    // 빈 값은 fields에서 제외.
    const fields: Record<string, string> = {};
    if (score) fields.스코어 = score;
    if (resultLabel) fields.결과 = resultLabel;
    if (meNameOut) fields.나 = meNameOut;
    if (oppNameOut) fields.상대 = oppNameOut;
    for (const slot of sport.slots) {
      const v = (slotValues[slot.label] ?? '').trim();
      if (v) fields[slot.label] = v;
    }

    // meta: 비어있지 않은 부분만 결합.
    const meta = [oppNameOut, score, resultLabel].filter(Boolean).join(' · ');

    const payload = {
      activity,
      template: 'match' as const,
      dateISO: editing ? record!.dateISO : today,
      timeLabel: editing ? record!.timeLabel : '방금',
      meta,
      rating,
      memo,
      photos,
      fields,
    };
    if (editing) {
      updateRecord(recordId!, payload);
      nav.goBack();
    } else {
      addRecord(payload);
      nav.navigate('MainTabs');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={iconFor(sportKey)}
        color={c.team}
        soft={c.teamSoft}
        onCancel={() => nav.goBack()}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 13 }}>
        {/* 종목 chips — selecting one swaps the key-record slots below */}
        <View>
          {sectionLabel('종목')}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {SPORTS.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                selected={s.key === sportKey}
                color={c.team}
                onPress={() => selectSport(s.key)}
              />
            ))}
            <Chip
              label="변경"
              dashed
              icon={<Icon.chevronDown size={12} color={c.text3} strokeWidth={2.4} />}
            />
          </View>
        </View>

        {/* Score card — 나 vs 상대 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>{sport.meLabel}</Text>
            <TextInput
              value={meName}
              onChangeText={setMeName}
              placeholder={sport.meLabel}
              placeholderTextColor={c.text3}
              style={{ fontSize: 14, fontWeight: '700', color: c.team, textAlign: 'center', padding: 0, alignSelf: 'stretch' }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TextInput
              value={meScore}
              onChangeText={setMeScore}
              placeholder="0"
              placeholderTextColor={c.text3}
              keyboardType="number-pad"
              style={{ fontSize: 26, fontWeight: '800', color: c.text, textAlign: 'center', padding: 0, minWidth: 28 }}
            />
            <Text style={{ fontSize: 16, color: c.text3 }}>:</Text>
            <TextInput
              value={oppScore}
              onChangeText={setOppScore}
              placeholder="0"
              placeholderTextColor={c.text3}
              keyboardType="number-pad"
              style={{ fontSize: 26, fontWeight: '800', color: c.text3, textAlign: 'center', padding: 0, minWidth: 28 }}
            />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>{sport.oppLabel}</Text>
            <TextInput
              value={oppName}
              onChangeText={setOppName}
              placeholder={sport.oppLabel}
              placeholderTextColor={c.text3}
              style={{ fontSize: 14, fontWeight: '700', color: c.text, textAlign: 'center', padding: 0, alignSelf: 'stretch' }}
            />
          </View>
        </View>

        {/* 결과 Segmented — 개인전 승/패, 팀전 승/무/패 */}
        <Segmented options={resultOptions} value={result} onChange={setResult} color={c.success} />

        {/* 게임 스코어 field — 라켓 종목만 (팀 종목은 스코어 카드로 충분) */}
        {sport.gameScore ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Text style={{ fontSize: 12, color: c.text2 }}>게임 스코어</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginTop: 3 }}>{sport.gameScore}</Text>
            </View>
          </View>
        ) : null}

        {/* 종목별 핵심 기록 — swappable template slots driven by the selected 종목 */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.team, letterSpacing: 0.4 }}>종목별 핵심 기록</Text>
            <Text style={{ fontSize: 10, color: c.text3 }}>· 템플릿 슬롯</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {sport.slots.map((slot, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c.teamSoft, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 12, color: c.text2 }}>{slot.label}</Text>
                <TextInput
                  value={slotValues[slot.label] ?? ''}
                  onChangeText={(t) => setSlotValue(slot.label, t)}
                  placeholder="0"
                  placeholderTextColor={c.text3}
                  keyboardType="number-pad"
                  style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 2, padding: 0 }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* 공통 세부 입력 disclosure (collapsed, badge 선택) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용"
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />

        {/* Expanded — 사진 */}
        {open ? (
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

            {/* 평점 */}
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>평점</Text>
              <RatingInput value={rating} onChange={setRating} size={20} />
            </View>

            {/* 메모 */}
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>메모</Text>
              <TextInput
                value={memo}
                onChangeText={setMemo}
                placeholder="경기 소감을 남겨보세요"
                placeholderTextColor={c.text3}
                multiline
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  minHeight: 46,
                  fontSize: 13,
                  color: c.text,
                  lineHeight: 20,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>
        ) : null}

        {/* footer hint */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
          <View style={{ marginTop: 1 }}>
            <Glyph size={13} color={c.text3}>
              <Path d="M12 8v4l3 2" />
              <Path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
            </Glyph>
          </View>
          <Text style={{ flex: 1, fontSize: 11, lineHeight: 16, color: c.text3 }}>
            팀/개인 구분 없이 하나의 MatchForm. 축구는 우리팀·포지션, 배드민턴은 게임 스코어 — 슬롯만 교체.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

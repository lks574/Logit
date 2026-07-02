import { useNavigation } from '@react-navigation/native';
import { choosePhoto, photoUri } from '../../../lib/photos';
import React from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/primitives';
import { FormHeader } from '../../../components/FormHeader';
import { DisclosureButton } from '../../../components/Field';
import { Segmented, Chip } from '../../../components/controls';
import { RatingInput } from '../../../components/Rating';
import { Glyph, Path, Rect, Icon } from '../../../components/Glyph';
import { SPORTS, ACTIVITY_TO_SPORT, sportFor } from '../../../data/sports';
import { useStore } from '../../../store/StoreContext';
import { useTheme } from '../../../theme/ThemeContext';

// 3.3 MatchForm — 대전·경기형 (team color). Sport-agnostic: the 종목 chip drives
// the swappable "종목별 핵심 기록" fields (schema in src/data/sports.ts), the score
// card, and the 결과 segment. 개인전(승/패) vs 팀전(승/무/패). Copy: Logit.dc.html 557–617.

export default function MatchForm({ activity, recordId }: { activity: string; recordId?: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, updateRecord, getRecord, today } = useStore();
  const editing = !!recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // 종목: 편집 시 저장된 fields.종목 우선(칩을 바꿔 저장한 값 보존), 없으면 활동명 기준.
  const [sportKey, setSportKey] = React.useState(
    record?.fields?.종목 ?? ACTIVITY_TO_SPORT[record?.activity ?? activity] ?? ACTIVITY_TO_SPORT[activity] ?? SPORTS[0].key,
  );
  const [open, setOpen] = React.useState(editing); // 세부 입력 disclosure (open when editing)
  const [photos, setPhotos] = React.useState<string[]>(record?.photos ?? []);
  const [rating, setRating] = React.useState(editing ? record?.rating ?? 0 : 0);
  const [memo, setMemo] = React.useState(record?.memo ?? '');
  const sport = sportFor(sportKey);

  // 스코어 카드 값 — CREATE는 공백(placeholder), EDIT는 record.fields.스코어("a:b") 파싱.
  const editScore = editing ? (record?.fields?.스코어 ?? '').split(':') : [];
  const [meScore, setMeScore] = React.useState(editScore[0]?.trim() ?? '');
  const [oppScore, setOppScore] = React.useState(editScore[1]?.trim() ?? '');
  // 이름 — CREATE는 공백(placeholder), EDIT는 저장된 값(record.fields) 사용.
  const [meName, setMeName] = React.useState(record?.fields?.나 ?? '');
  const [oppName, setOppName] = React.useState(record?.fields?.상대 ?? '');
  // 종목별 핵심 기록 필드 값 — CREATE는 공백, EDIT는 필드 key와 일치하는 record.fields 값.
  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>(() =>
    editing
      ? Object.fromEntries(sport.fields.map((f) => [f.key, record?.fields?.[f.key] ?? '']))
      : {},
  );
  const setFieldValue = (key: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [key]: value }));

  // 렌더 그룹: text 필드(게임스코어·포지션)는 전체 폭 행, number 필드는 2열 그리드 카드.
  const textFields = sport.fields.filter((f) => f.type === 'text');
  const numberFields = sport.fields.filter((f) => f.type === 'number');

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
  // 사용자가 결과 세그먼트를 건드렸는지(또는 편집 중 기존 결과가 있었는지). 안 건드렸으면
  // 기본값 '승'을 저장하지 않는다.
  const [resultTouched, setResultTouched] = React.useState<boolean>(!!record?.fields?.결과);

  // 종목 전환 시 현재 결과가 새 옵션에 없으면(예: 팀→개인 전환 시 '무') '승'으로 리셋.
  const selectSport = (key: string) => {
    setSportKey(key);
    // 종목 전환 시 입력값 초기화 — 공유 키(게임스코어·에이스 등)가 다른 종목으로
    // 이월돼 형식이 어긋나는 것을 막는다.
    setFieldValues({});
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
    const uri = await choosePhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const handleSave = () => {
    const hasField = sport.fields.some((f) => (fieldValues[f.key] ?? '').trim() !== '');
    if (meScore.trim() === '' && oppScore.trim() === '' && oppName.trim() === '' && !hasField) {
      Alert.alert('필수 항목', '스코어나 상대, 기록을 입력해 주세요.');
      return;
    }
    const resultLabel = resultOptions.find((o) => o.key === result)?.label ?? '승';
    const hasScore = meScore.trim() !== '' || oppScore.trim() !== '';
    const score = hasScore ? `${meScore.trim() || '0'}:${oppScore.trim() || '0'}` : '';
    const meNameOut = meName.trim();
    const oppNameOut = oppName.trim();

    // 빈 값은 fields에서 제외.
    const fields: Record<string, string> = {};
    fields.종목 = sportKey; // 종목 보존 — 편집 시 활동명 역추론에 기대지 않는다.
    if (score) fields.스코어 = score;
    if (resultTouched && resultLabel) fields.결과 = resultLabel;
    if (meNameOut) fields.나 = meNameOut;
    if (oppNameOut) fields.상대 = oppNameOut;
    for (const f of sport.fields) {
      const v = (fieldValues[f.key] ?? '').trim();
      if (v) fields[f.key] = v;
    }

    // meta: 비어있지 않은 부분만 결합.
    const meta = [oppNameOut, score, resultTouched ? resultLabel : ''].filter(Boolean).join(' · ');

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
        <Segmented
          options={resultOptions}
          value={result}
          onChange={(v) => {
            setResult(v);
            setResultTouched(true);
          }}
          color={c.success}
        />

        {/* 종목별 핵심 기록 — 선택된 종목의 필드 스키마(src/data/sports.ts)로 렌더 */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.team, letterSpacing: 0.4 }}>종목별 핵심 기록</Text>
            <Text style={{ fontSize: 10, color: c.text3 }}>· 종목별 템플릿</Text>
          </View>

          {/* text 필드(게임스코어·포지션) — 전체 폭 입력행 */}
          {textFields.length > 0 ? (
            <View style={{ gap: 8, marginBottom: numberFields.length > 0 ? 10 : 0 }}>
              {textFields.map((f) => (
                <View key={f.key} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
                  <Text style={{ fontSize: 12, color: c.text2 }}>{f.label}</Text>
                  <TextInput
                    value={fieldValues[f.key] ?? ''}
                    onChangeText={(t) => setFieldValue(f.key, t)}
                    placeholder={f.placeholder}
                    placeholderTextColor={c.text3}
                    style={{ fontSize: 15, fontWeight: '600', color: c.text, marginTop: 3, padding: 0 }}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {/* number 필드 — 2열 그리드 카드 */}
          {numberFields.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {numberFields.map((f) => (
                <View key={f.key} style={{ flexGrow: 1, flexBasis: '45%', backgroundColor: c.teamSoft, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                  <Text style={{ fontSize: 12, color: c.text2 }}>{f.label}</Text>
                  <TextInput
                    value={fieldValues[f.key] ?? ''}
                    onChangeText={(t) => setFieldValue(f.key, t)}
                    placeholder={f.placeholder ?? '0'}
                    placeholderTextColor={c.text3}
                    keyboardType="number-pad"
                    style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 2, padding: 0 }}
                  />
                </View>
              ))}
            </View>
          ) : null}
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
                <Image key={uri} source={{ uri: photoUri(uri) }} style={{ width: 60, height: 60, borderRadius: 11 }} />
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
            팀/개인 구분 없이 하나의 MatchForm. 축구는 골·포지션, 배드민턴은 게임 스코어 — 종목 필드만 교체.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

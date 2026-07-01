import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton } from '../../components/Field';
import { Segmented, Chip } from '../../components/controls';
import { Glyph, Path, Icon } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';

// 3.3 MatchForm — 대전·경기형 (team color). Sport-agnostic: the 종목 chip drives
// the swappable "종목별 핵심 기록" slots and the 결과 segment options.
// 개인전(승/패) vs 팀전(승/무/패). Copy: Logit.dc.html lines 557–617.

type Slot = { label: string; value: string };

type Sport = {
  key: string;
  label: string;
  team?: boolean; // team sport → 승/무/패
  slots: [Slot, Slot]; // 종목별 핵심 기록 — swappable template slots
};

// Sport registry. Not a hardcoded soccer↔baseball toggle — each 종목 chip carries
// its own key-record slots, so selecting a chip swaps the slots below.
const SPORTS: Sport[] = [
  { key: 'badminton', label: '배드민턴', slots: [{ label: '최장 랠리', value: '32' }, { label: '에이스', value: '5' }] },
  { key: 'tennis', label: '테니스', slots: [{ label: '에이스', value: '7' }, { label: '더블폴트', value: '3' }] },
  { key: 'pingpong', label: '탁구', slots: [{ label: '최장 랠리', value: '18' }, { label: '서브 득점', value: '9' }] },
];

export default function MatchForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const [sportKey, setSportKey] = React.useState(SPORTS[0].key);
  const sport = SPORTS.find((s) => s.key === sportKey) ?? SPORTS[0];

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
  const [result, setResult] = React.useState<string>('win');

  const iconFor = (key: string) => {
    switch (key) {
      case 'tennis':
        return <Icon.tennis size={13} color={c.team} strokeWidth={2.2} />;
      case 'pingpong':
        return <Icon.pingpong size={13} color={c.team} strokeWidth={2.2} />;
      default:
        return <Icon.badminton size={13} color={c.team} strokeWidth={2.2} />;
    }
  };

  const sectionLabel = (text: string) => (
    <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>{text}</Text>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={iconFor(sportKey)}
        color={c.team}
        soft={c.teamSoft}
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
                onPress={() => setSportKey(s.key)}
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
            <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>나</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.team }}>민준</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: c.text }}>2</Text>
            <Text style={{ fontSize: 16, color: c.text3 }}>:</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: c.text3 }}>1</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>상대</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>지현</Text>
          </View>
        </View>

        {/* 결과 Segmented — 개인전 승/패, 팀전 승/무/패 */}
        <Segmented options={resultOptions} value={result} onChange={setResult} color={c.success} />

        {/* 게임 스코어 field */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
            <Text style={{ fontSize: 12, color: c.text2 }}>게임 스코어</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginTop: 3 }}>21-18 · 19-21 · 21-15</Text>
          </View>
        </View>

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
                <Text style={{ fontSize: 24, fontWeight: '700', color: c.text, marginTop: 2 }}>{slot.value}</Text>
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
        />

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

import React from 'react';
import {
  Alert,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  NativeScrollEvent,
} from 'react-native';
import { Screen } from '../../components/primitives';
import { Glyph, Path, Circle } from '../../components/Glyph';
import { PrimaryButton } from '../../components/auth-ui';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';
import { tr } from '../../i18n/i18n';

const TOTAL = 4;
// 4단계 활동 후보 — 실제 카탈로그 활동(선택이 preferredActivities로 저장됨).
const ACTIVITY_CHOICES = ['헬스', '런닝', '클라이밍', '수영', '뮤지컬', '자전거', '독서', '요가'];

export default function OnboardingScreen() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { profile, completeOnboarding, addActivity } = useStore();
  const [step, setStep] = React.useState(0);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [extras, setExtras] = React.useState<string[]>([]);
  const [pagerH, setPagerH] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const goTo = (i: number) => scrollRef.current?.scrollTo({ x: i * width, animated: true });
  const finish = () => completeOnboarding(selected);
  const next = () => (step < TOTAL - 1 ? goTo(step + 1) : finish());

  // 스와이프 종료 시 현재 페이지 → step 동기화(도트·건너뛰기·CTA 라벨).
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== step) setStep(i);
  };

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const addCustom = () => {
    // Alert.prompt는 iOS 전용 — 없으면 조용히 무시(디자인상 선택 기능).
    if (Platform.OS !== 'ios' || !Alert.prompt) return;
    Alert.prompt(tr({ en: 'Add your own', ko: '직접 추가' }), tr({ en: 'Enter the name of the activity to log.', ko: '기록할 활동 이름을 입력하세요.' }), (name) => {
      const n = (name ?? '').trim();
      if (!n) return;
      addActivity({ name: n, template: 'free' });
      setExtras((e) => (e.includes(n) ? e : [...e, n]));
      setSelected((s) => (s.includes(n) ? s : [...s, n]));
    });
  };

  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ flex: 1 }}>
      {/* 건너뛰기 — 마지막 단계 제외 */}
      <View style={{ height: 34, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 22 }}>
        {step < TOTAL - 1 ? (
          <Pressable onPress={finish} hitSlop={8}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: c.text3 }}>{tr({ en: 'Skip', ko: '건너뛰기' })}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onLayout={(e) => setPagerH(e.nativeEvent.layout.height)}
        style={{ flex: 1 }}
      >
        <View style={{ width, height: pagerH }}>
          <Welcome c={c} name={profile.name} />
        </View>
        <View style={{ width, height: pagerH }}>
          <RecordMethods c={c} />
        </View>
        <View style={{ width, height: pagerH }}>
          <CalendarPreview c={c} />
        </View>
        <View style={{ width, height: pagerH }}>
          <FirstActivity
            c={c}
            choices={[...ACTIVITY_CHOICES, ...extras]}
            selected={selected}
            onToggle={toggle}
            onAddCustom={addCustom}
          />
        </View>
      </ScrollView>

      {/* 진행 도트 + CTA */}
      <View style={{ paddingHorizontal: 26, paddingBottom: 8, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 22 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === step ? c.accent : c.border,
              }}
            />
          ))}
        </View>
        <PrimaryButton label={step === TOTAL - 1 ? tr({ en: 'Start Logit', ko: 'Logit 시작하기' }) : tr({ en: 'Next', ko: '다음' })} onPress={next} />
      </View>
    </Screen>
  );
}

// ---- 1단계 · 환영 ----
function Welcome({ c, name }: { c: any; name: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 26 }}>
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 30,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: c.accent,
          shadowOpacity: 0.4,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 14 },
        }}
      >
        <Glyph size={54} color="#fff" strokeWidth={2.1}>
          <Path d="M4 19 L9 12 L13 15 L20 5" />
        </Glyph>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 23, fontWeight: '700', letterSpacing: -0.69, color: c.text }}>
          {tr({
            en: `Welcome, ${name || 'Logger'}`,
            ko: `환영해요, ${name || '기록가'}님`,
          })}
        </Text>
        <Text style={{ fontSize: 14.5, color: c.text2, lineHeight: 23, textAlign: 'center', marginTop: 12 }}>
          {tr({
            en: 'Workouts, shows, and everyday notes —\nstack your scattered moments in Logit.\nYou can capture today in 30 seconds.',
            ko: '운동, 공연, 하루의 메모까지 —\n흩어진 순간을 Logit 한 곳에 쌓아요.\n30초면 오늘을 남길 수 있어요.',
          })}
        </Text>
      </View>
    </View>
  );
}

// ---- 2단계 · 기록 방식 ----
function RecordMethods({ c }: { c: any }) {
  const cards = [
    { title: tr({ en: 'Sets · Reps', ko: '세트 · 횟수형' }), sub: tr({ en: 'Gym · Climbing · Home workout', ko: '헬스 · 클라이밍 · 홈트' }), icon: <Path d="M6 6v12M18 6v12M6 12h12M4 9v6M20 9v6" /> },
    { title: tr({ en: 'Distance · Time', ko: '거리 · 시간형' }), sub: tr({ en: 'Running · Swimming · Cycling', ko: '러닝 · 수영 · 자전거' }), icon: (<><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>) },
    { title: tr({ en: 'Watch · Free notes', ko: '관람 · 자유 기록형' }), sub: tr({ en: 'Shows · Exhibits · Journal', ko: '공연 · 전시 · 일기' }), icon: <Path d="M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13M8 8h7M8 11h7" /> },
  ];
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, gap: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 23, fontWeight: '700', letterSpacing: -0.69, color: c.text }}>{tr({ en: 'Grouped by how you log', ko: '기록 방식으로 묶어요' })}</Text>
        <Text style={{ fontSize: 14.5, color: c.text2, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
          {tr({ en: 'Not by activity, but by ', ko: '종목이 아니라 ' })}
          <Text style={{ color: c.text, fontWeight: '700' }}>{tr({ en: 'how you log it', ko: '기록 방식' })}</Text>
          {tr({ en: '.\nSame frame, just change the numbers.', ko: '으로.\n같은 골격 위에 수치만 바꿔 남겨요.' })}
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {cards.map((card) => (
          <View
            key={card.title}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              paddingVertical: 13,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Glyph size={19} color={c.accent} strokeWidth={2}>
                {card.icon}
              </Glyph>
            </View>
            <View>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.text }}>{card.title}</Text>
              <Text style={{ fontSize: 12.5, color: c.text3, marginTop: 2 }}>{card.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- 3단계 · 캘린더 미리보기 ----
function CalendarPreview({ c }: { c: any }) {
  // HTML 데모 셀 순서 그대로.
  const cells: ('full' | 'partial' | 'plan' | 'empty')[] = [
    'full', 'partial', 'plan', 'empty', 'full', 'empty', 'plan',
    'empty', 'full', 'empty', 'partial', 'empty', 'plan', 'full',
  ];
  const dot = (t: (typeof cells)[number], key: number) => {
    const base = { width: 20, height: 20, borderRadius: 10 } as const;
    if (t === 'full') return <View key={key} style={{ ...base, backgroundColor: c.accent }} />;
    if (t === 'partial') return <View key={key} style={{ ...base, backgroundColor: withAlpha(c.accent, 35) }} />;
    if (t === 'plan') return <View key={key} style={{ ...base, borderWidth: 1.6, borderColor: c.accent, borderStyle: 'dashed' }} />;
    return <View key={key} style={{ ...base, backgroundColor: c.surfaceAlt }} />;
  };
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, gap: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 23, fontWeight: '700', letterSpacing: -0.69, color: c.text }}>{tr({ en: 'A month at a glance', ko: '한 달을 한눈에' })}</Text>
        <Text style={{ fontSize: 14.5, color: c.text2, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
          {tr({ en: 'See past records and upcoming plans together.', ko: '지난 기록과 앞으로의 약속을 함께 봐요.' })}
        </Text>
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 }}>
          {cells.map((t, i) => dot(t, i))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: c.accent }} />
            <Text style={{ fontSize: 12.5, color: c.text2 }}>{tr({ en: 'Done', ko: '한 일' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 13, height: 13, borderRadius: 7, borderWidth: 1.6, borderColor: c.accent, borderStyle: 'dashed' }} />
            <Text style={{ fontSize: 12.5, color: c.text2 }}>{tr({ en: 'Planned', ko: '약속한 것' })}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---- 4단계 · 첫 활동 고르기 ----
function FirstActivity({
  c,
  choices,
  selected,
  onToggle,
  onAddCustom,
}: {
  c: any;
  choices: string[];
  selected: string[];
  onToggle: (n: string) => void;
  onAddCustom: () => void;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 22 }}>
      <Text style={{ fontSize: 23, fontWeight: '700', letterSpacing: -0.69, color: c.text }}>{tr({ en: 'What will you log first?', ko: '무엇부터 기록할까요?' })}</Text>
      <Text style={{ fontSize: 14, color: c.text2, lineHeight: 22, marginTop: 8 }}>
        {tr({ en: 'We’ll put your picks on Home first.\nYou can change them anytime.', ko: '고른 활동을 홈에 먼저 올려둘게요.\n나중에 언제든 바꿀 수 있어요.' })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 22 }}>
        {choices.map((name) => {
          const on = selected.includes(name);
          return (
            <Pressable
              key={name}
              onPress={() => onToggle(name)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                paddingVertical: 9,
                paddingHorizontal: 15,
                backgroundColor: on ? c.accent : c.surface,
                borderWidth: 1,
                borderColor: on ? c.accent : c.border,
              }}
            >
              {on ? (
                <Glyph size={14} color="#fff" strokeWidth={3}>
                  <Path d="M5 12l5 5L20 6" />
                </Glyph>
              ) : null}
              <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#fff' : c.text }}>{name}</Text>
            </Pressable>
          );
        })}
        {/* 직접 추가 */}
        <Pressable
          onPress={onAddCustom}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            paddingVertical: 9,
            paddingHorizontal: 15,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderStyle: 'dashed',
          }}
        >
          <Glyph size={14} color={c.text2} strokeWidth={2.4}>
            <Path d="M12 5v14M5 12h14" />
          </Glyph>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>{tr({ en: 'Add your own', ko: '직접 추가' })}</Text>
        </Pressable>
      </View>
    </View>
  );
}

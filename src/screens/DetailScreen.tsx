import React from 'react';
import { Image, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Row, Screen } from '../components/primitives';
import { IconButton } from '../components/Button';
import { StatCard } from '../components/cards';
import { Stars } from '../components/Rating';
import { Glyph, Icon, Path } from '../components/Glyph';
import { activities, colorsFor } from '../data/activities';
import { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/StoreContext';
import { StoredRecord } from '../store/types';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/tokens';

type Cell = { value: string; label: string; valueColor?: string };
type DetailRow = { label: string; value: string };
type Cast = { label: string; primary?: boolean };
type Companion = { initial: string; name: string };

type Variant = {
  activity: string; // key into `activities`
  title: string; // display title (may differ from activity key, e.g. 뮤지컬 〈레미제라블〉)
  meta: string; // date · place
  rating: number;
  watchTag?: string; // spectate: N차 관람
  companion: Companion;
  photoLeft: string; // approximation of the HTML linear-gradient (bottom-right stop)
  photoRight: string;
  photoHeight: number;
  contentGap: number; // vertical gap between content sections (HTML: 런닝 14, others 13)
  score?: {
    ourLabel: string;
    ourTeam: string;
    ourScore: string;
    theirLabel: string;
    theirTeam: string;
    theirScore: string;
  };
  statCells: Cell[];
  detail?: DetailRow[]; // 상세 수치 table (cardio / match)
  cast?: Cast[]; // 출연진 chips (spectate)
  memo: string;
};

// Per-variant content, copied 1:1 from Logit.dc.html §4.1–4.5.
const VARIANTS: Record<string, (c: Palette) => Variant> = {
  런닝: (c) => ({
    activity: '런닝',
    title: '런닝',
    meta: '6월 30일 오후 6:30 · 한강공원',
    rating: 4,
    companion: { initial: '민', name: '민지' },
    photoLeft: '#8fa3ad',
    photoRight: '#caa787',
    photoHeight: 104,
    contentGap: 14,
    statCells: [
      { value: '5.2', label: '거리 km', valueColor: c.cardio },
      { value: '27:12', label: '시간' },
      { value: '5′14″', label: '페이스' },
    ],
    detail: [
      { label: '고도 상승', value: '42 m' },
      { label: '평균 심박', value: '152 bpm' },
      { label: '칼로리', value: '328 kcal' },
    ],
    memo: '노을이 좋았다. 마지막 1km 페이스 올림. 다음엔 7km 도전.',
  }),
  축구: (c) => ({
    activity: '축구',
    title: '축구',
    meta: '6월 8일 오후 3:00 · 잠실 보조경기장',
    rating: 4,
    companion: { initial: '준', name: '준호 외 4' },
    photoLeft: '#6d89ab',
    photoRight: '#93a6bc',
    photoHeight: 96,
    contentGap: 13,
    score: {
      ourLabel: '우리팀',
      ourTeam: 'FC 월요일',
      ourScore: '3',
      theirLabel: '상대팀',
      theirTeam: '강남 Utd',
      theirScore: '2',
    },
    statCells: [
      { value: '승', label: '결과', valueColor: c.success },
      { value: '2', label: '골', valueColor: c.team },
      { value: '1', label: '어시스트' },
    ],
    detail: [
      { label: '포지션', value: '미드필더' },
      { label: '출전 시간', value: '풀타임 90분' },
      { label: '슈팅 · 파울', value: '4 · 2' },
    ],
    memo: '후반 역전골. 컨디션 좋았다. 다음엔 수비 집중.',
  }),
  야구: (c) => ({
    activity: '야구',
    title: '야구',
    meta: '6월 15일 오전 10:00 · 사직 사회인구장',
    rating: 5,
    companion: { initial: '태', name: '태윤 외 8' },
    photoLeft: '#6d89ab',
    photoRight: '#93a6bc',
    photoHeight: 96,
    contentGap: 13,
    score: {
      ourLabel: '우리팀',
      ourTeam: '번개 BC',
      ourScore: '7',
      theirLabel: '상대팀',
      theirTeam: '해운대 HC',
      theirScore: '5',
    },
    statCells: [
      { value: '.500', label: '타율', valueColor: c.team },
      { value: '2', label: '안타' },
      { value: '3', label: '타점' },
    ],
    detail: [
      { label: '타석', value: '4' },
      { label: '득점 · 도루', value: '1 · 1' },
      { label: '수비 · 실책', value: '유격수 · 0' },
    ],
    memo: '2타점 적시타. 병살 하나 아쉬움. 타격감 유지 중.',
  }),
  뮤지컬: (c) => ({
    activity: '뮤지컬',
    title: '뮤지컬 〈레미제라블〉',
    meta: '6월 29일 오후 7:00 · 블루스퀘어',
    rating: 5,
    watchTag: '3차 관람',
    companion: { initial: '서', name: '서연' },
    photoLeft: '#8a6ba8',
    photoRight: '#a98ac6',
    photoHeight: 100,
    contentGap: 13,
    statCells: [
      { value: '1층 F12', label: '좌석', valueColor: c.perf },
      { value: '170분', label: '러닝타임' },
      { value: '₩150K', label: '티켓' },
    ],
    cast: [
      { label: '장발장 · 민우혁', primary: true },
      { label: '자베르 · 카이' },
      { label: '판틴 · 조정은' },
    ],
    memo: '민우혁 장발장 3번째. One Day More 소름. 다음 캐스팅도 예매.',
  }),
  연극: (c) => ({
    activity: '연극',
    title: '연극 〈고도를 기다리며〉',
    meta: '6월 18일 오후 4:00 · 명동예술극장',
    rating: 4,
    watchTag: '1차 관람',
    companion: { initial: '지', name: '지훈' },
    photoLeft: '#8a6ba8',
    photoRight: '#a98ac6',
    photoHeight: 100,
    contentGap: 13,
    statCells: [
      { value: '2층 B7', label: '좌석', valueColor: c.perf },
      { value: '130분', label: '러닝타임' },
      { value: '₩60K', label: '티켓' },
    ],
    cast: [
      { label: '블라디미르 · 신구', primary: true },
      { label: '에스트라공 · 박근형' },
    ],
    memo: '두 노배우의 호흡. 부조리극 특유의 여운. 원작 다시 읽기.',
  }),
};

// Korean date label from an ISO calendar day (e.g. "2026-06-30" → "6월 30일").
function krDate(dateISO: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(dateISO);
  if (!m) return dateISO;
  return `${Number(m[1])}월 ${Number(m[2])}일`;
}

// Build a Variant-shaped view model from a real stored record so the existing
// JSX (which renders a Variant) can display it unchanged.
function variantFromRecord(r: StoredRecord, c: Palette): Variant {
  // meta: "6월 30일 오후 6:30 · 한강공원" — place taken from record.meta's first segment.
  const place = r.meta ? r.meta.split('·')[0].trim() : '';
  const metaParts = [krDate(r.dateISO), r.timeLabel].filter(Boolean);
  const meta = place ? `${metaParts.join(' ')} · ${place}` : metaParts.join(' ');

  const companionName = r.companions && r.companions.length ? r.companions.join(', ') : '';
  const companion: Companion = {
    initial: companionName ? companionName.charAt(0) : '',
    name: companionName,
  };

  const fields = r.fields ?? {};
  const detail: DetailRow[] = Object.entries(fields).map(([label, value]) => ({ label, value }));

  return {
    activity: r.activity,
    title: r.activity,
    meta,
    rating: r.rating ?? 0,
    companion,
    photoLeft: '#8fa3ad',
    photoRight: '#caa787',
    photoHeight: 104,
    contentGap: 14,
    statCells: [],
    detail: detail.length ? detail : undefined,
    memo: r.memo ?? '',
  };
}

export default function DetailScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const { getRecord } = useStore();

  const activityKey = route.params?.activity;
  const recordId = route.params?.recordId;
  const record = recordId ? getRecord(recordId) : undefined;

  // Real record → render its data; otherwise keep the design showcase variants.
  const v = record
    ? variantFromRecord(record, c)
    : ((activityKey && VARIANTS[activityKey]) || VARIANTS['런닝'])(c);

  // Activity resolution: registry first, else fall back to the record's own
  // template + a default icon (README §Activity resolution).
  const registered = activities[v.activity];
  const template = registered?.template ?? record?.template ?? 'endurance';
  const { color, soft } = colorsFor(template, c);
  const ActivityIcon = registered ? Icon[registered.icon] : Icon.yoga;

  const photos = record?.photos;
  const hasPhotos = !!(photos && photos.length);

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 28 }}>
      {/* Header row: back / edit / delete */}
      <Row between center style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}>
        <IconButton size={34} bg={c.surface} onPress={() => nav.goBack()}>
          <Glyph size={18} color={c.text} strokeWidth={2.2}>
            <Path d="M15 6l-6 6 6 6" />
          </Glyph>
        </IconButton>
        <Row gap={8} center>
          <IconButton
            size={34}
            bg={c.surface}
            onPress={() => nav.navigate('RecordForm', { activity: v.activity, template })}
          >
            <Icon.edit size={17} color={c.text2} strokeWidth={2} />
          </IconButton>
          <IconButton size={34} bg={c.surface} onPress={() => nav.goBack()}>
            <Icon.trash size={17} color={c.error} strokeWidth={2} />
          </IconButton>
        </Row>
      </Row>

      <View style={{ paddingHorizontal: 16, gap: v.contentGap }}>
        {/* Activity header */}
        <Row gap={12} center>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIcon size={26} color={color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 21, fontWeight: '700', color: c.text, letterSpacing: -0.42 }}>{v.title}</Text>
            <Text style={{ fontSize: 13, color: c.text2, marginTop: 2 }}>{v.meta}</Text>
          </View>
        </Row>

        {/* Rating + (watch tag) + companion */}
        <Row gap={8} center style={{ flexWrap: 'wrap' }}>
          <Stars filled={v.rating} size={14} />
          {v.watchTag ? (
            <View style={{ backgroundColor: c.perfSoft, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.perf }}>{v.watchTag}</Text>
            </View>
          ) : null}
          {v.companion.name ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 9,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{v.companion.initial}</Text>
              </View>
              <Text style={{ fontSize: 12, color: c.text2 }}>{v.companion.name}</Text>
            </View>
          ) : null}
        </Row>

        {/* Match: score card 우리 vs 상대 */}
        {v.score ? (
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
            <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>{v.score.ourLabel}</Text>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color }}>
                {v.score.ourTeam}
              </Text>
            </View>
            <Row gap={6} center style={{ flexShrink: 0 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: c.text }}>{v.score.ourScore}</Text>
              <Text style={{ fontSize: 16, color: c.text3 }}>:</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: c.text3 }}>{v.score.theirScore}</Text>
            </Row>
            <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>{v.score.theirLabel}</Text>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: c.text }}>
                {v.score.theirTeam}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Metric block */}
        {v.statCells.length ? <StatCard cells={v.statCells} /> : null}

        {/* Photos — real images when the record has them, else gradient placeholders */}
        {hasPhotos ? (
          <Row gap={8}>
            {photos!.slice(0, 2).map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={{ flex: 1, height: v.photoHeight, borderRadius: 13, backgroundColor: c.surfaceAlt }}
                resizeMode="cover"
              />
            ))}
            {photos!.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </Row>
        ) : (
          <Row gap={8}>
            <View style={{ flex: 1, height: v.photoHeight, borderRadius: 13, backgroundColor: v.photoLeft }} />
            <View style={{ flex: 1, height: v.photoHeight, borderRadius: 13, backgroundColor: v.photoRight }} />
          </Row>
        )}

        {/* 상세 수치 table (cardio / match) */}
        {v.detail ? (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 6 }}>상세 수치</Text>
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, overflow: 'hidden' }}>
              {v.detail.map((d, i) => (
                <View key={d.label}>
                  {i > 0 ? <View style={{ height: 1, backgroundColor: c.border }} /> : null}
                  <Row between center style={{ paddingVertical: 11, paddingHorizontal: 14 }}>
                    <Text style={{ fontSize: 13, color: c.text2 }}>{d.label}</Text>
                    <Text style={{ fontSize: 13, color: c.text, fontWeight: '600' }}>{d.value}</Text>
                  </Row>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 출연진 chips (spectate) */}
        {v.cast ? (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 7 }}>출연진</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {v.cast.map((cast) => (
                <View
                  key={cast.label}
                  style={{
                    backgroundColor: cast.primary ? c.perf : c.surface,
                    borderWidth: cast.primary ? 0 : 1,
                    borderColor: c.border,
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, color: cast.primary ? '#fff' : c.text2 }}>{cast.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Memo block */}
        {v.memo ? (
          <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 5 }}>메모</Text>
            <Text style={{ fontSize: 14, color: c.text, lineHeight: 22 }}>{v.memo}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

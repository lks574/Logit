import React from 'react';
import { Alert, Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Row, Screen } from '../../components/primitives';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconButton } from '../../components/Button';
import { Stars } from '../../components/Rating';
import { Glyph, Icon, Path } from '../../components/Glyph';
import { activities, activityLabel, colorsFor } from '../../data/activities';
import { tr } from '../../i18n/i18n';
import { monthDay, displayTimeLabel } from '../../lib/date';
import { RootStackParamList } from '../../navigation/types';
import { photoUri } from '../../lib/photos';
import { shareRecordCard } from '../../lib/shareCard';
import ShareCard from '../../components/ShareCard';
import { useStore } from '../../store/StoreContext';
import { StoredRecord } from '../../store/types';
import { recordEnd } from '../../store/selectors';
import { parseExercises } from '../../lib/strength';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../theme/tokens';

type DetailRow = { label: string; value: string };
type Companion = { initial: string; name: string };

type Variant = {
  activity: string; // key into `activities`
  title: string; // display title
  meta: string; // date · place
  rating: number;
  companion: Companion;
  photoHeight: number;
  contentGap: number;
  detail?: DetailRow[]; // 상세 수치 table
  memo: string;
};


// Build a Variant-shaped view model from a real stored record so the existing
// JSX (which renders a Variant) can display it unchanged.
function variantFromRecord(r: StoredRecord, c: Palette): Variant {
  // place: fields.장소에서 가져온다(모든 폼이 여기 저장). meta 첫 세그먼트 파싱은
  // endurance에만 맞아 다른 종목에선 작품명/상대명을 장소로 오인했다.
  const place = r.fields?.장소 ?? '';
  // 멀티데이(캠핑·여행)면 헤더 날짜를 범위로: "6월 30일 – 7월 2일".
  const end = recordEnd(r);
  const dateLabel = end > r.dateISO ? `${monthDay(r.dateISO)} – ${monthDay(end)}` : monthDay(r.dateISO);
  const metaParts = [dateLabel, displayTimeLabel(r.timeLabel)].filter(Boolean);
  const meta = place ? `${metaParts.join(' ')} · ${place}` : metaParts.join(' ');

  const companionName = r.companions && r.companions.length ? r.companions.join(', ') : '';
  const companion: Companion = {
    initial: companionName ? companionName.charAt(0) : '',
    name: companionName,
  };

  const fields = r.fields ?? {};
  // 헤더/내부용 키는 상세 수치 표에서 제외(장소=헤더에 표시, 세트=JSON 직렬화, 종목=sport key).
  // 저장 순서가 seed·폼마다 달라, 표준 순서로 정렬해 폼과 동일하게 노출한다.
  const FIELD_ORDER = ['기간', '작품', '공연장', '좌석', '회차', '티켓', '출연진', '거리', '시간', '속도', '고도', '칼로리', '평균심박', '기분'];
  const rank = (k: string) => {
    const i = FIELD_ORDER.indexOf(k);
    return i === -1 ? FIELD_ORDER.length : i;
  };
  const detail: DetailRow[] = Object.entries(fields)
    // 장소=헤더, 세트/운동=JSON(별도 섹션), 종목=sport key, 마지막일=원시 ISO(기간 라벨로 대체) → 표에서 제외.
    .filter(([k]) => k !== '장소' && k !== '세트' && k !== '운동' && k !== '종목' && k !== '마지막일')
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([label, value]) => ({ label, value }));

  return {
    activity: r.activity,
    title: r.activity,
    meta,
    rating: r.rating ?? 0,
    companion,
    photoHeight: 104,
    contentGap: 14,
    detail: detail.length ? detail : undefined,
    memo: r.memo ?? '',
  };
}

export default function DetailScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const { getRecord, deleteRecord } = useStore();

  const recordId = route.params?.recordId;
  const record = recordId ? getRecord(recordId) : undefined;
  // 사진 전체화면 뷰어 — 탭한 사진 uri를 담으면 모달이 뜬다.
  const [zoom, setZoom] = React.useState<string | null>(null);
  // 공유 카드 캡처 대상(오프스크린 렌더). 웹은 view-shot 미지원이라 버튼 자체를 숨긴다.
  const cardRef = React.useRef<View>(null);
  const canShare = Platform.OS !== 'web';

  // 레코드가 없으면(recordId 미전달·삭제됨·stale·가져오기로 교체됨) 빈 상태를 보여준다.
  if (!record) {
    return (
      <Screen edges={['top']}>
        <Row between center style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}>
          <IconButton size={34} bg={c.surface} onPress={() => nav.goBack()}>
            <Glyph size={18} color={c.text} strokeWidth={2.2}>
              <Path d="M15 6l-6 6 6 6" />
            </Glyph>
          </IconButton>
        </Row>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 15, color: c.text2 }}>{tr({ en: 'Record not found.', ko: '기록을 찾을 수 없어요.' })}</Text>
        </View>
      </Screen>
    );
  }

  const v = variantFromRecord(record, c);

  // Activity resolution: registry first, else fall back to the record's own
  // template + a default icon (README §Activity resolution).
  const registered = activities[v.activity];
  const template = registered?.template ?? record.template;
  const { color, soft } = colorsFor(template, c);
  const ActivityIcon = registered ? Icon[registered.icon] : Icon.yoga;

  const photos = record.photos;
  const hasPhotos = !!(photos && photos.length);

  return (
    <Screen edges={['top']} contentStyle={{ paddingBottom: 28 }}>
      {/* Header: 뒤로 / 수정 / 삭제 */}
      <ScreenHeader
        style={{ paddingTop: 6 }}
        right={
          <>
            {canShare ? (
              <IconButton
                size={34}
                bg={c.surface}
                label={tr({ en: 'Share', ko: '공유' })}
                onPress={() => shareRecordCard(cardRef).catch(() => {})}
              >
                <Icon.share size={17} color={c.text2} strokeWidth={2} />
              </IconButton>
            ) : null}
            <IconButton
              size={34}
              bg={c.surface}
              label={tr({ en: 'Edit', ko: '수정' })}
              onPress={() => nav.navigate('RecordForm', { activity: v.activity, template, recordId })}
            >
              <Icon.edit size={17} color={c.text2} strokeWidth={2} />
            </IconButton>
            <IconButton
              size={34}
              bg={c.surface}
              label={tr({ en: 'Delete', ko: '삭제' })}
              onPress={() => {
                if (!recordId) {
                  nav.goBack();
                  return;
                }
                Alert.alert(tr({ en: 'Delete record', ko: '기록 삭제' }), tr({ en: 'Delete this record?', ko: '이 기록을 삭제할까요?' }), [
                  { text: tr({ en: 'Cancel', ko: '취소' }), style: 'cancel' },
                  {
                    text: tr({ en: 'Delete', ko: '삭제' }),
                    style: 'destructive',
                    onPress: () => {
                      deleteRecord(recordId);
                      nav.goBack();
                    },
                  },
                ]);
              }}
            >
              <Icon.trash size={17} color={c.error} strokeWidth={2} />
            </IconButton>
          </>
        }
      />

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
            <Text style={{ fontSize: 21, fontWeight: '700', color: c.text, letterSpacing: -0.42 }}>{activityLabel(v.title)}</Text>
            <Text style={{ fontSize: 13, color: c.text2, marginTop: 2 }}>{v.meta}</Text>
          </View>
        </Row>

        {/* Rating + companion */}
        <Row gap={8} center style={{ flexWrap: 'wrap' }}>
          {v.rating > 0 ? (
            <Row gap={5} center>
              <Stars filled={v.rating} size={14} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.text2 }}>{v.rating.toFixed(1)}</Text>
            </Row>
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

        {/* Photos — 실제 사진이 있을 때만 표시. 탭 → 전체화면. */}
        {hasPhotos ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos!.map((uri, i) => (
              <Pressable
                key={`${uri}-${i}`}
                onPress={() => setZoom(photoUri(uri))}
                style={{ width: photos!.length === 1 ? '100%' : '48%' }}
              >
                <Image
                  source={{ uri: photoUri(uri) }}
                  style={{ width: '100%', height: v.photoHeight, borderRadius: 13, backgroundColor: c.surfaceAlt }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* 상세 수치 table (cardio / match) */}
        {v.detail ? (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 6 }}>{tr({ en: 'Details', ko: '상세 수치' })}</Text>
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

        {/* 근력 종목·세트 breakdown (setrep 전용) */}
        {record.template === 'setrep' ? (() => {
          const exercises = parseExercises(record.fields).filter((ex) => ex.name || ex.sets.length);
          if (!exercises.length) return null;
          return (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 6 }}>{tr({ en: 'Exercises', ko: '종목' })}</Text>
              <View style={{ gap: 8 }}>
                {exercises.map((ex, ei) => (
                  <View key={ei} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, padding: 12, gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{ex.name || tr({ en: `Exercise ${ei + 1}`, ko: `종목 ${ei + 1}` })}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {ex.sets.map((s, si) => (
                        <View key={si} style={{ backgroundColor: s.warmup ? c.surfaceAlt : color + '1A', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 }}>
                          <Text style={{ fontSize: 12, color: s.warmup ? c.text3 : c.text2, fontWeight: '600' }}>
                            {s.warmup ? tr({ en: 'W ', ko: '워밍업 ' }) : ''}{s.reps || '0'}×{s.weight || '0'}kg
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })() : null}

        {/* Memo block */}
        {v.memo ? (
          <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: 5 }}>{tr({ en: 'Memo', ko: '메모' })}</Text>
            <Text style={{ fontSize: 14, color: c.text, lineHeight: 22 }}>{v.memo}</Text>
          </View>
        ) : null}
      </View>

      {/* 전체화면 사진 뷰어 — 아무 곳이나 탭하면 닫힘 */}
      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable onPress={() => setZoom(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center' }}>
          {zoom ? <Image source={{ uri: zoom }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
          <Pressable onPress={() => setZoom(null)} hitSlop={10} style={{ position: 'absolute', top: 52, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.close size={20} color="#fff" strokeWidth={2.4} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* 공유 카드 — 화면 밖 렌더(캡처 전용). opacity 0 금지: Android가 캡처 못 함. */}
      {canShare ? (
        <View style={{ position: 'absolute', left: -9999, top: 0 }} pointerEvents="none">
          <ShareCard ref={cardRef} record={record} />
        </View>
      ) : null}
    </Screen>
  );
}

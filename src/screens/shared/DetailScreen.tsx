import React from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Row, Screen } from '../../components/primitives';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconButton } from '../../components/Button';
import { Stars } from '../../components/Rating';
import { Glyph, Icon, Path } from '../../components/Glyph';
import { activities, colorsFor } from '../../data/activities';
import { RootStackParamList } from '../../navigation/types';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../store/StoreContext';
import { StoredRecord } from '../../store/types';
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


// Korean date label from an ISO calendar day (e.g. "2026-06-30" → "6월 30일").
function krDate(dateISO: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(dateISO);
  if (!m) return dateISO;
  return `${Number(m[1])}월 ${Number(m[2])}일`;
}

// Build a Variant-shaped view model from a real stored record so the existing
// JSX (which renders a Variant) can display it unchanged.
function variantFromRecord(r: StoredRecord, c: Palette): Variant {
  // place: fields.장소에서 가져온다(모든 폼이 여기 저장). meta 첫 세그먼트 파싱은
  // endurance에만 맞아 다른 종목에선 작품명/상대명을 장소로 오인했다.
  const place = r.fields?.장소 ?? '';
  const metaParts = [krDate(r.dateISO), r.timeLabel].filter(Boolean);
  const meta = place ? `${metaParts.join(' ')} · ${place}` : metaParts.join(' ');

  const companionName = r.companions && r.companions.length ? r.companions.join(', ') : '';
  const companion: Companion = {
    initial: companionName ? companionName.charAt(0) : '',
    name: companionName,
  };

  const fields = r.fields ?? {};
  // 헤더/내부용 키는 상세 수치 표에서 제외(장소=헤더에 표시, 세트=JSON 직렬화, 종목=sport key).
  // 저장 순서가 seed·폼마다 달라, 표준 순서로 정렬해 폼과 동일하게 노출한다.
  const FIELD_ORDER = ['작품', '공연장', '좌석', '회차', '티켓', '출연진', '거리', '시간', '페이스', '고도', '칼로리', '평균심박', '기분'];
  const rank = (k: string) => {
    const i = FIELD_ORDER.indexOf(k);
    return i === -1 ? FIELD_ORDER.length : i;
  };
  const detail: DetailRow[] = Object.entries(fields)
    .filter(([k]) => k !== '장소' && k !== '세트' && k !== '종목')
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
          <Text style={{ fontSize: 15, color: c.text2 }}>기록을 찾을 수 없어요.</Text>
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
            <IconButton
              size={34}
              bg={c.surface}
              label="수정"
              onPress={() => nav.navigate('RecordForm', { activity: v.activity, template, recordId })}
            >
              <Icon.edit size={17} color={c.text2} strokeWidth={2} />
            </IconButton>
            <IconButton
              size={34}
              bg={c.surface}
              label="삭제"
              onPress={() => {
                if (!recordId) {
                  nav.goBack();
                  return;
                }
                Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
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
            <Text style={{ fontSize: 21, fontWeight: '700', color: c.text, letterSpacing: -0.42 }}>{v.title}</Text>
            <Text style={{ fontSize: 13, color: c.text2, marginTop: 2 }}>{v.meta}</Text>
          </View>
        </Row>

        {/* Rating + companion */}
        <Row gap={8} center style={{ flexWrap: 'wrap' }}>
          <Stars filled={v.rating} size={14} />
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

        {/* Photos — 실제 사진이 있을 때만 표시 */}
        {hasPhotos ? (
          <Row gap={8}>
            {photos!.slice(0, 2).map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri: photoUri(uri) }}
                style={{ flex: 1, height: v.photoHeight, borderRadius: 13, backgroundColor: c.surfaceAlt }}
                resizeMode="cover"
              />
            ))}
            {photos!.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </Row>
        ) : null}

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

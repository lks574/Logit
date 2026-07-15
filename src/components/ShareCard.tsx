import React from 'react';
import { Image, Text, View } from 'react-native';
import { Icon } from './Glyph';
import { activities, activityLabel, colorsFor } from '../data/activities';
import { monthDay, displayTimeLabel } from '../lib/date';
import { photoUri } from '../lib/photos';
import { StoredRecord } from '../store/types';
import { recordEnd } from '../store/selectors';
import { light } from '../theme/tokens';

// 공유 카드 — 기록 1건을 이미지로 캡처하기 위한 오프스크린 뷰(4:5, 인스타 비율).
// 팔레트는 항상 light 고정 — 다크모드에서 캡처해도 결과물이 오염되지 않게.
// react-native-view-shot의 captureRef 대상이라 root View에 ref를 전달받는다.

export const SHARE_W = 340;
export const SHARE_H = 425;

// 상세 표에서 제외할 내부 키(DetailScreen과 동일 규칙). 카드엔 상위 3개만 노출.
const INTERNAL = new Set(['장소', '세트', '종목', '마지막일', '기분']);

const ShareCard = React.forwardRef<View, { record: StoredRecord }>(({ record }, ref) => {
  const registered = activities[record.activity];
  const template = registered?.template ?? record.template;
  const { color, soft } = colorsFor(template, light);
  const ActivityIcon = registered ? Icon[registered.icon] : Icon.yoga;

  const end = recordEnd(record);
  const dateLabel = end > record.dateISO ? `${monthDay(record.dateISO)} – ${monthDay(end)}` : monthDay(record.dateISO);
  const timeLabel = displayTimeLabel(record.timeLabel);

  const place = record.fields?.장소 ?? '';
  const rows = Object.entries(record.fields ?? {})
    .filter(([k]) => !INTERNAL.has(k))
    .slice(0, 3);

  const photo = record.photos && record.photos.length ? photoUri(record.photos[0]) : null;
  const rating = record.rating ?? 0;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: SHARE_W, height: SHARE_H, backgroundColor: light.surface, padding: 22, justifyContent: 'space-between' }}
    >
      <View style={{ gap: 16 }}>
        {/* 헤더: 아이콘 타일 + 활동명 + 날짜 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIcon size={24} color={color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 19, fontWeight: '700', color: light.text, letterSpacing: -0.4 }}>
              {activityLabel(record.activity)}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 12.5, color: light.text2, marginTop: 2 }}>
              {[dateLabel, timeLabel, place].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {/* 별점 — 채운 별만, light.star 고정 */}
        {rating > 0 ? (
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 15, color: i < rating ? light.star : light.border }}>★</Text>
            ))}
          </View>
        ) : null}

        {/* 사진 1장 */}
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', height: 150, borderRadius: 13, backgroundColor: light.surfaceAlt }} resizeMode="cover" />
        ) : null}

        {/* 핵심 필드 최대 3개 */}
        {rows.length ? (
          <View style={{ backgroundColor: light.surfaceAlt, borderRadius: 13, paddingVertical: 4, paddingHorizontal: 14 }}>
            {rows.map(([label, value], i) => (
              <View
                key={label}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: light.border,
                }}
              >
                <Text style={{ fontSize: 13, color: light.text2 }}>{label}</Text>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: light.text, maxWidth: '65%' }}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* 워터마크 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>L</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: light.text2, letterSpacing: 0.2 }}>Logit</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

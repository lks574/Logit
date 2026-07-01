import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CompanionChip, RatingInput } from '../../components/Rating';
import { DisclosureButton } from '../../components/Field';
import { FormHeader } from '../../components/FormHeader';
import { Glyph, Icon, Path, Rect } from '../../components/Glyph';
import { Screen } from '../../components/primitives';
import { activities, colorsFor } from '../../data/activities';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';

// §03 3.1 거리·시간형 — EnduranceForm (cardio). Embeds §02 common skeleton.
// HTML source of truth: Logit.dc.html 2.1 (296–358), 2.2 (359–437), 3.1 (444–502).
export default function EnduranceForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const [open, setOpen] = React.useState(false); // 세부 입력 disclosure (collapsed default)
  const [rating, setRating] = React.useState(4);

  const template = activities[activity]?.template ?? 'endurance';
  const { color, soft } = colorsFor(template, c);
  const ActIcon = Icon.running;

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<ActIcon size={13} color={color} strokeWidth={2.2} />}
        color={color}
        soft={soft}
        onCancel={() => nav.goBack()}
      />

      <View style={{ padding: 16, paddingTop: 14, gap: 14 }}>
        {/* Prefill button (2.1) — accent-soft, refresh icon */}
        <Pressable
          onPress={() => {}}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            backgroundColor: c.accentSoft,
            borderWidth: 1,
            borderColor: withAlpha(c.accent, 22),
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <Icon.refresh size={17} color={c.accent} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: c.accent }}>
            어제 {activity} 불러와서 수정
          </Text>
          <Icon.chevronRight size={16} color={c.accent} strokeWidth={2} />
        </Pressable>

        {/* HealthKit / Health Connect — disabled placeholder (3.1) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: c.border,
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: c.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph size={17} color={c.text2} strokeWidth={1.8}>
              <Path d="M19 14c-1.5 1.6-3.6 3.3-7 6-3.4-2.7-5.5-4.4-7-6-2.5-2.7-2-6 1-7 1.8-.6 3.6 0 4.6 1.2.6.7.7.9 1.4.9s.8-.2 1.4-.9C15.4 7 17.2 6.4 19 7c3 1 3.5 4.3 1 7z" />
            </Glyph>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>건강 앱에서 불러오기</Text>
            <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>
              HealthKit · Health Connect · 후속 지원
            </Text>
          </View>
          <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: c.text3 }}>준비 중</Text>
          </View>
        </View>

        {/* 핵심 수치 · 필수 — 거리 / 시간 (3.1) */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: c.text3,
              letterSpacing: 0.44,
              marginBottom: 7,
            }}
          >
            핵심 수치 · 필수
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderWidth: 1.5,
                borderColor: color,
                borderRadius: 13,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: c.text2 }}>거리</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: c.text }}>5.2</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color }}>km</Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 13,
                paddingVertical: 12,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: c.text2 }}>시간</Text>
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: c.text }}>27:12</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 상세 수치 — 평균 페이스(자동)/고도/칼로리/평균 심박 (3.1) */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: c.text3,
              letterSpacing: 0.44,
              marginBottom: 7,
            }}
          >
            상세 수치
          </Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 13,
              overflow: 'hidden',
            }}
          >
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>평균 페이스</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>5′14″/km</Text>
                <View style={{ backgroundColor: soft, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color }}>자동</Text>
                </View>
              </View>
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>고도 상승</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>42 m</Text>
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <Text style={{ fontSize: 14, color: c.text }}>칼로리</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>328 kcal</Text>
            </DetailRow>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <DetailRow>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Glyph size={16} color={c.error} strokeWidth={2}>
                  <Path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8-1c-2.2 2.2-2 5.6.4 8L12 21l8.4-7.4c2.4-2.4 2.6-5.8.4-8z" />
                </Glyph>
                <Text style={{ fontSize: 14, color: c.text }}>평균 심박</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>152 bpm</Text>
            </DetailRow>
          </View>
        </View>

        {/* 세부 입력 disclosure — collapsed by default (2.1) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용"
          open={open}
          onPress={() => setOpen((v) => !v)}
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
        />

        {/* Expanded detail fields (2.2) */}
        {open ? (
          <View style={{ gap: 15 }}>
            {/* 장소 */}
            <View>
              <Text style={styleLabel(c)}>장소</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                }}
              >
                <Glyph size={16} color={c.text3} strokeWidth={2}>
                  <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                  <Path d="M12 10 m -2.6 0 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0" />
                </Glyph>
                <Text style={{ fontSize: 14, color: c.text }}>한강공원</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                {['최근 · 올림픽공원', '양재천'].map((t) => (
                  <View
                    key={t}
                    style={{
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 7,
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: c.text2 }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 동행 */}
            <View>
              <Text style={styleLabel(c)}>동행</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: c.accent,
                    borderRadius: 999,
                    paddingVertical: 7,
                    paddingLeft: 8,
                    paddingRight: 11,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: 'rgba(255,255,255,.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>민</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#fff' }}>민지</Text>
                  <Glyph size={12} color="#fff" strokeWidth={2.6}>
                    <Path d="M6 6l12 12M18 6 6 18" />
                  </Glyph>
                </View>
                <View
                  style={{
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 999,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, color: c.text2 }}>+ 지훈</Text>
                </View>
                <CompanionChip name="추가" dashed />
              </View>
            </View>

            {/* 사진 */}
            <View>
              <Text style={styleLabel(c)}>사진</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 60, height: 60, borderRadius: 11, backgroundColor: '#b7c4ca' }} />
                <View style={{ width: 60, height: 60, borderRadius: 11, backgroundColor: '#d6b9a6' }} />
                <View
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
                </View>
              </View>
            </View>

            {/* 평점 */}
            <View>
              <Text style={styleLabel(c)}>평점</Text>
              <RatingInput value={rating} onChange={setRating} size={20} />
            </View>

            {/* 기분 */}
            <View>
              <Text style={styleLabel(c)}>기분</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { d: 'M8.5 15.5c1-1.4 6-1.4 7 0M9 9.5h.01M15 9.5h.01', on: false },
                  { d: 'M8.5 14h7M9 9.5h.01M15 9.5h.01', on: false },
                  { d: 'M8.5 13.5c1 1.4 6 1.4 7 0M9 9.5h.01M15 9.5h.01', on: true },
                  { d: 'M8 13c1.2 2 6.8 2 8 0M9 9.5h.01M15 9.5h.01', on: false },
                ].map((m, i) => (
                  <View
                    key={i}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      backgroundColor: m.on ? c.accentSoft : c.surface,
                      borderWidth: m.on ? 1.5 : 1,
                      borderColor: m.on ? c.accent : c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Glyph size={20} color={m.on ? c.accent : c.text3} strokeWidth={2}>
                      <Path d="M12 12 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0" />
                      <Path d={m.d} />
                    </Glyph>
                  </View>
                ))}
              </View>
            </View>

            {/* 메모 */}
            <View>
              <Text style={styleLabel(c)}>메모</Text>
              <View
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  minHeight: 46,
                }}
              >
                <Text style={{ fontSize: 13, color: c.text, lineHeight: 20 }}>
                  노을이 좋았다. 마지막 1km 페이스 올림.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // Footer note — only in collapsed/quick state (2.1)
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 4,
            }}
          >
            <Icon.check size={14} color={c.text3} />
            <Text style={{ fontSize: 12, color: c.text3 }}>오프라인에서도 즉시 저장됩니다</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function DetailRow({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      {children}
    </View>
  );
}

function styleLabel(c: ReturnType<typeof useTheme>['c']) {
  return {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.text,
    marginBottom: 7,
  };
}

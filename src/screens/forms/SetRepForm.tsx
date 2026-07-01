import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton } from '../../components/Field';
import { Chip } from '../../components/controls';
import { Glyph, Icon, Path } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';

// SetRepForm (HTML 3.2, lines 503–556) — 세트·횟수형 (strength template).
// 운동 부위 chips · per-exercise set table · ＋세트/종목 추가 · 볼륨/시간 summary
// · 공통 세부 입력 disclosure.

type SetRow = { set: string; reps: string; weight: string; warmup: boolean };

const PARTS = ['가슴', '삼두', '등', '어깨', '하체'];

export default function SetRepForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const [part, setPart] = React.useState('가슴');
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<SetRow[]>([
    { set: 'W', reps: '15', weight: '40', warmup: true },
    { set: '1', reps: '10', weight: '70', warmup: false },
    { set: '2', reps: '8', weight: '75', warmup: false },
  ]);

  const addSet = () =>
    setRows((r) => [
      ...r,
      { set: String(r.filter((x) => x.set !== 'W').length + 1), reps: '', weight: '', warmup: false },
    ]);

  const toggleWarmup = (i: number) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, warmup: !row.warmup } : row)));

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<Icon.dumbbell size={13} color={c.strength} strokeWidth={2.2} />}
        color={c.strength}
        soft={c.strengthSoft}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 운동 부위 */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 8 }}>운동 부위</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {PARTS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={p === part}
                color={c.strength}
                onPress={() => setPart(p)}
              />
            ))}
          </View>
        </View>

        {/* 벤치프레스 세트 테이블 */}
        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>벤치프레스</Text>
            <Text style={{ fontSize: 12, color: c.text3 }}>{rows.length}세트</Text>
          </View>

          {/* column header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14 }}>
            <Text style={{ width: 30, fontSize: 11, fontWeight: '600', color: c.text3 }}>세트</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>반복</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: c.text3 }}>중량</Text>
            <Text style={{ width: 44, fontSize: 11, fontWeight: '600', color: c.text3, textAlign: 'right' }}>워밍업</Text>
          </View>

          {rows.map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <Text style={{ width: 30, fontSize: 13, color: c.text2 }}>{row.set}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text }}>{row.reps || '-'}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.text }}>
                {row.weight || '-'}
                <Text style={{ fontSize: 11, fontWeight: '500', color: c.text3 }}>kg</Text>
              </Text>
              <View style={{ width: 44, alignItems: 'flex-end' }}>
                <Pressable
                  onPress={() => toggleWarmup(i)}
                  hitSlop={8}
                  style={{
                    width: 34,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: row.warmup ? c.strength : c.surfaceAlt,
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      marginLeft: row.warmup ? 16 : 2,
                      shadowColor: '#000',
                      shadowOpacity: row.warmup ? 0 : 0.2,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: row.warmup ? 0 : 1,
                    }}
                  />
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addSet}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 11,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <Icon.plus size={15} color={c.strength} strokeWidth={2.4} />
            <Text style={{ color: c.strength, fontSize: 13, fontWeight: '600' }}>세트 추가</Text>
          </Pressable>
        </View>

        {/* 인클라인 덤벨 (collapsed exercise) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 13,
            paddingVertical: 13,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>인클라인 덤벨</Text>
          <Icon.chevronRight size={18} color={c.text3} strokeWidth={2} />
        </View>

        {/* ＋종목 추가 */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            paddingVertical: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: c.border,
            borderRadius: 13,
          }}
        >
          <Icon.plus size={16} color={c.text2} strokeWidth={2.2} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text2 }}>종목 추가</Text>
        </Pressable>

        {/* summary */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.strengthSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: c.text2 }}>
              총 볼륨 <Text style={{ fontSize: 10, fontWeight: '600', color: c.strength }}>자동</Text>
            </Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
              4,250<Text style={{ fontSize: 12, color: c.text2 }}>kg</Text>
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: c.text2 }}>운동 시간</Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 2 }}>
              52<Text style={{ fontSize: 12, color: c.text2 }}>분</Text>
            </Text>
          </View>
        </View>

        {/* 공통 세부 입력 (collapsed default) */}
        <DisclosureButton
          title="세부 입력"
          badge="선택"
          subtitle="장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용"
          icon={<Icon.plus size={17} color={c.text2} strokeWidth={2.2} />}
          open={open}
          onPress={() => setOpen((o) => !o)}
        />
        {open ? (
          <View
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: withAlpha(c.strength, 22),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Glyph size={16} color={c.text3}>
                <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <Path d="M12 10m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0" />
              </Glyph>
              <Text style={{ fontSize: 13, color: c.text2 }}>장소 · 동행 · 사진 · 메모 · 평점 · 기분 · 비용</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

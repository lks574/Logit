import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, T, Row } from '../components/primitives';
import { Icon } from '../components/Glyph';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/tokens';
import { activities, colorsFor } from '../data/activities';
import { TemplateType } from '../theme/tokens';
import { useStore } from '../store/StoreContext';

// Frequently-used pill tiles ("자주 쓰는").
const FAVORITES = ['런닝', '헬스', '배드민턴'];

// Template groups (grid tiles). "＋직접 추가" handled separately.
const MATCH_GROUP = ['축구', '야구', '배드민턴', '테니스', '탁구', '주짓수'];
const FREE_GROUP = ['요가', '독서'];

export default function ActivitySelectScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { customActivities } = useStore();

  const goRecord = (name: string, template: TemplateType) =>
    nav.navigate('RecordForm', { activity: name, template });

  // Pill tile in the "자주 쓰는" row.
  const Pill = ({ name }: { name: string }) => {
    const a = activities[name];
    const { color, soft } = colorsFor(a.template, c);
    const Ico = Icon[a.icon];
    return (
      <Pressable
        onPress={() => goRecord(name, a.template)}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          paddingVertical: 9,
          paddingHorizontal: 10,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={14} color={color} />
        </View>
        <T style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {name}
        </T>
      </Pressable>
    );
  };

  // Grid tile (3-col). `selected` renders the team-soft bg + border variant.
  const Tile = ({ name, selected }: { name: string; selected?: boolean }) => {
    const a = activities[name];
    const { color, soft } = colorsFor(a.template, c);
    const Ico = Icon[a.icon];
    return (
      <Pressable
        onPress={() => goRecord(name, a.template)}
        style={{
          flex: 1,
          alignItems: 'center',
          gap: 6,
          backgroundColor: selected ? soft : c.surface,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? color : c.border,
          borderRadius: 12,
          paddingVertical: 11,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: selected ? c.surface : soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={17} color={color} />
        </View>
        <T
          style={{ fontSize: 11.5, fontWeight: selected ? '700' : '600' }}
          numberOfLines={1}
        >
          {name}
        </T>
      </Pressable>
    );
  };

  // Grid tile for a user-added custom activity: resolve color from its template
  // and fall back to a default icon when the name isn't in the builtin registry.
  const CustomTile = ({ name, template }: { name: string; template: TemplateType }) => {
    const { color, soft } = colorsFor(template, c);
    const Ico = activities[name] ? Icon[activities[name].icon] : Icon.yoga;
    return (
      <Pressable
        onPress={() => goRecord(name, template)}
        style={{
          flex: 1,
          alignItems: 'center',
          gap: 6,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          paddingVertical: 11,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ico size={17} color={color} />
        </View>
        <T style={{ fontSize: 11.5, fontWeight: '600' }} numberOfLines={1}>
          {name}
        </T>
      </Pressable>
    );
  };

  // "＋직접 추가" dashed accent tile.
  const AddTile = () => (
    <Pressable
      onPress={() => nav.navigate('AddActivity')}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: c.surface,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: withAlpha(c.accent, 45),
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 4,
      }}
    >
      <Icon.plus size={18} color={c.accent} strokeWidth={2.2} />
      <T style={{ fontSize: 11.5, fontWeight: '700' }} c={c.accent}>
        직접 추가
      </T>
    </Pressable>
  );

  const SectionDot = ({ color }: { color: string }) => (
    <View
      style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }}
    />
  );

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingBottom: 24 }}>
      {/* Header row */}
      <Row
        between
        center
        style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 }}
      >
        <T style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }}>
          무엇을 기록할까요?
        </T>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: c.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon.close size={16} color={c.text2} strokeWidth={2.4} />
        </Pressable>
      </Row>

      {/* Search field */}
      <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
        <Row
          center
          gap={9}
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <Icon.search size={17} color={c.text3} />
          <T style={{ fontSize: 14 }} c={c.text3}>
            종목 검색 · 배드민턴, 요가…
          </T>
        </Row>
      </View>

      {/* Sections */}
      <View style={{ paddingHorizontal: 18, gap: 15 }}>
        {/* 자주 쓰는 */}
        <View>
          <T
            style={{ fontSize: 12, fontWeight: '600', marginBottom: 8 }}
            c={c.text2}
          >
            자주 쓰는
          </T>
          <Row gap={8}>
            {FAVORITES.map((name) => (
              <Pill key={name} name={name} />
            ))}
          </Row>
        </View>

        {/* 대전·경기형 */}
        <View style={{ gap: 6 }}>
          <Row center gap={6}>
            <SectionDot color={c.team} />
            <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
              대전·경기형
            </T>
            <T style={{ fontSize: 11 }} c={c.text3}>
              · 상대 있는 종목
            </T>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MATCH_GROUP.map((name) => (
              <View key={name} style={{ width: '31%', flexGrow: 1 }}>
                <Tile name={name} />
              </View>
            ))}
          </View>
        </View>

        {/* 자유 기록형 */}
        <View style={{ gap: 6 }}>
          <Row center gap={6}>
            <SectionDot color={c.accent} />
            <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
              자유 기록형
            </T>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FREE_GROUP.map((name) => (
              <View key={name} style={{ width: '31%', flexGrow: 1 }}>
                <Tile name={name} />
              </View>
            ))}
            <View style={{ width: '31%', flexGrow: 1 }}>
              <AddTile />
            </View>
          </View>
        </View>

        {/* 내 활동 — user-added custom activities from the store */}
        {customActivities.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Row center gap={6}>
              <SectionDot color={c.text2} />
              <T style={{ fontSize: 12, fontWeight: '600' }} c={c.text2}>
                내 활동
              </T>
            </Row>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {customActivities.map((a) => (
                <View key={a.name} style={{ width: '31%', flexGrow: 1 }}>
                  <CustomTile name={a.name} template={a.template} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

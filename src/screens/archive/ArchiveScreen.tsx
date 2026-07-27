import React from 'react';
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ActivityCard } from '../../components/cards';
import { Icon } from '../../components/Glyph';
import { useTheme } from '../../theme/ThemeContext';
import { useStore } from '../../store/StoreContext';
import { activities, activityLabel, colorsFor } from '../../data/activities';
import { StoredRecord } from '../../store/types';
import { displayTimeLabel, slashDayWeekday } from '../../lib/date';
import { recordEnd } from '../../store/selectors';
import { tr } from '../../i18n/i18n';

// ArchiveScreen — 전체 기록을 월별 섹션으로 시간순(최신 → 과거) 훑는 화면.
//
// 왜 필요했나: 홈 "전체 보기"가 Calendar로 보냈지만 캘린더는 **선택한 하루**만 보여줘서
// (CalendarScreen의 recordsCovering), 날짜를 기억해야만 과거 기록을 찾을 수 있었다.
// 기록이 쌓일수록 탐색 비용이 선형으로 늘어나는 구조.
//
// 스코프: 월별 섹션 + 월 점프까지만. 검색·필터는 넣지 않는다(별건).

type Section = { monthKey: string; title: string; data: StoredRecord[] };

// '2026-07' → '2026년 7월' / 'July 2026'
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function monthTitle(monthKey: string): string {
  const y = monthKey.slice(0, 4);
  const m = parseInt(monthKey.slice(5, 7), 10);
  return tr({ en: `${MON_EN[m - 1]} ${y}`, ko: `${y}년 ${m}월` });
}
// 월 점프 칩용 짧은 라벨 — '26.7'
const monthChip = (monthKey: string) => `${monthKey.slice(2, 4)}.${parseInt(monthKey.slice(5, 7), 10)}`;

export default function ArchiveScreen() {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { records, customActivities } = useStore();
  const listRef = React.useRef<SectionList<StoredRecord, Section>>(null);

  // 활동 이름 → 템플릿(빌트인 없으면 커스텀). 색 해석에 쓴다.
  const templateOf = React.useCallback(
    (r: StoredRecord) =>
      activities[r.activity]?.template ?? customActivities.find((a) => a.name === r.activity)?.template ?? r.template,
    [customActivities],
  );

  // 월별 그룹. records 배열 순서는 삽입순(addRecord가 prepend)이라 과거 날짜를 나중에
  // 추가하면 어긋난다 → dateISO로 명시 정렬한다. 같은 날은 시간 늦은 것이 위.
  const sections = React.useMemo<Section[]>(() => {
    const sorted = [...records].sort((a, b) => {
      if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? 1 : -1;
      return (b.timeLabel ?? '').localeCompare(a.timeLabel ?? '');
    });
    const groups = new Map<string, StoredRecord[]>();
    for (const r of sorted) {
      const key = r.dateISO.slice(0, 7);
      const list = groups.get(key);
      if (list) list.push(r);
      else groups.set(key, [r]);
    }
    return [...groups.entries()].map(([monthKey, data]) => ({ monthKey, title: monthTitle(monthKey), data }));
  }, [records]);

  const jumpTo = (sectionIndex: number) => {
    listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewPosition: 0, animated: true });
  };

  if (!records.length) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={tr({ en: 'All records', ko: '전체 기록' })} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>
            {tr({ en: 'No records yet', ko: '아직 기록이 없어요' })}
          </Text>
          <Text style={{ fontSize: 13, color: c.text3, textAlign: 'center' }}>
            {tr({ en: 'Records you add will be gathered here by month.', ko: '기록을 추가하면 월별로 모아서 보여드려요.' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title={tr({ en: 'All records', ko: '전체 기록' })}
        right={
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>
            {tr({ en: `${records.length}`, ko: `${records.length}건` })}
          </Text>
        }
      />

      {/* 월 점프 — 섹션이 2개 이상일 때만. 검색 없이 "기억 없이 훑기"를 돕는 최소 장치. */}
      {sections.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 6 }}
        >
          {sections.map((s, i) => (
            <Pressable
              key={s.monthKey}
              onPress={() => jumpTo(i)}
              accessibilityRole="button"
              accessibilityLabel={tr({ en: `Jump to ${s.title}`, ko: `${s.title}로 이동` })}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 11,
                borderRadius: 999,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.text2 }}>{monthChip(s.monthKey)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(r) => r.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        // 가상화 목록이라 섹션이 아직 안 그려졌으면 scrollToLocation이 실패할 수 있다.
        // 대략 위치로 한 번 보낸 뒤 재시도한다.
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.getScrollResponder()?.scrollTo({ y: index * averageItemLength, animated: false });
        }}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: c.bg, paddingTop: 12, paddingBottom: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{section.title}</Text>
              <Text style={{ fontSize: 11, color: c.text3 }}>
                {tr({ en: `${section.data.length}`, ko: `${section.data.length}건` })}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item: r }) => {
          const rc = colorsFor(templateOf(r), c);
          const iconName = activities[r.activity]?.icon;
          const IconComp = iconName ? Icon[iconName] : Icon.yoga;
          // 멀티데이(캠핑·여행)면 날짜를 범위로 — 섹션이 월이라 일자만 보여도 충분하다.
          const end = recordEnd(r);
          const dateText = end > r.dateISO ? `${slashDayWeekday(r.dateISO)} – ${slashDayWeekday(end)}` : slashDayWeekday(r.dateISO);
          return (
            <View style={{ marginBottom: 8 }}>
              <ActivityCard
                color={rc.color}
                soft={rc.soft}
                icon={<IconComp size={19} color={rc.color} />}
                title={activityLabel(r.activity)}
                time={[dateText, displayTimeLabel(r.timeLabel)].filter(Boolean).join(' · ')}
                meta={r.meta}
                ratingFilled={r.rating}
                memo={r.memo}
                onPress={() => nav.navigate('Detail', { activity: r.activity, recordId: r.id })}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

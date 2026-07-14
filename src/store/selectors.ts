import { TemplateType } from '../theme/tokens';
import { StoredPlan, StoredRecord } from './types';
import { tr } from '../i18n/i18n';
import { activities } from '../data/activities';

// Pure derivations over store state. Dates are 'YYYY-MM-DD'.

export function dayDiff(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO + 'T00:00:00Z');
  const b = Date.parse(toISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

// D-day from `today` to a plan date. 0 → D-DAY, positive → D-n.
export function dday(dateISO: string, today: string): number {
  return dayDiff(today, dateISO);
}

export function recordsOn(records: StoredRecord[], dateISO: string): StoredRecord[] {
  return records.filter((r) => r.dateISO === dateISO);
}

// 기록의 종료일 — endDateISO 우선, 레거시(캠핑 fields.마지막일) 폴백, 없으면 시작일(하루).
export function recordEnd(r: StoredRecord): string {
  return r.endDateISO ?? r.fields?.마지막일 ?? r.dateISO;
}

// 해당 날짜를 '포함'하는 기록(멀티데이 걸침): 시작 ≤ d ≤ 종료.
export function recordsCovering(records: StoredRecord[], dateISO: string): StoredRecord[] {
  return records.filter((r) => r.dateISO <= dateISO && dateISO <= recordEnd(r));
}

export function plansOn(plans: StoredPlan[], dateISO: string): StoredPlan[] {
  return plans.filter((p) => p.dateISO === dateISO);
}

// Upcoming (today or later, not done), soonest first.
export function upcomingPlans(plans: StoredPlan[], today: string): StoredPlan[] {
  return plans
    .filter((p) => !p.done && dayDiff(today, p.dateISO) >= 0)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

// Trailing-7-days window ending `today` (design "6/24 – 6/30"): count + running
// distance + streak. Records outside the window are excluded so the "이번 주"
// card stays bounded as new records accumulate.
export function weekStats(records: StoredRecord[], today: string) {
  const inWindow = records.filter((r) => {
    const diff = dayDiff(r.dateISO, today); // today - record day
    return diff >= 0 && diff <= 6;
  });
  const count = inWindow.length;
  let km = 0;
  for (const r of inWindow) {
    const d = r.fields?.거리; // "5.2km"
    if (d) km += parseFloat(d) || 0;
  }
  // 활동 구성: 이번 주 기록을 종목(activity)별로 집계 — 색은 template로 결정.
  const byActivity = new Map<string, { count: number; template: TemplateType }>();
  for (const r of inWindow) {
    const e = byActivity.get(r.activity) ?? { count: 0, template: r.template };
    e.count += 1;
    byActivity.set(r.activity, e);
  }
  const composition = [...byActivity.entries()]
    .map(([activity, v]) => ({ activity, count: v.count, template: v.template }))
    .sort((a, b) => b.count - a.count);
  // streak: consecutive days ending today(하루 유예 포함) with ≥1 record.
  const streak = countStreak(new Set(records.map((r) => r.dateISO)), today);
  return { count, km: Math.round(km * 10) / 10, streak, composition };
}

// ---- Stats / 회고 aggregations ----

const isoMinusDays = (fromISO: string, i: number) =>
  new Date(Date.parse(fromISO + 'T00:00:00Z') - i * 86400000).toISOString().slice(0, 10);

// 연속 기록 일수 — 오늘부터 거슬러 센다. 단 오늘 기록이 아직 없으면 어제부터 세어,
// 자정~그날 첫 기록 전까지 진행 중인 연속이 0으로 리셋되지 않도록 하루 유예를 준다.
function countStreak(days: Set<string>, today: string): number {
  let streak = 0;
  for (let i = days.has(today) ? 0 : 1; days.has(isoMinusDays(today, i)); i++) streak++;
  return streak;
}

const parseKm = (r: StoredRecord) => parseFloat(r.fields?.거리 ?? '') || 0;
// "11.5km/h" → km/h(number). 숫자 부분만 파싱.
const parseSpeed = (r: StoredRecord): number | null => {
  const s = r.fields?.속도;
  if (!s) return null;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// 회고 하이라이트 — 앱의 회고 특색을 한 줄로. 자격 있는 후보를 모두 모아 배열로 반환
// (통계에서 좌우 스크롤 배너로 표시). 후보가 없으면 빈 배열.
type Highlight = { emoji: string; title: string; sub: string };
export function retroHighlights(records: StoredRecord[], today: string): Highlight[] {
  const cands: Highlight[] = [];

  // 최다 관람 작품(2회 이상)
  const topBy = (key: string, tpl: TemplateType) => {
    const m = new Map<string, number>();
    for (const r of records) {
      if (r.template !== tpl) continue;
      const v = r.fields?.[key];
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    let best = '';
    let bestN = 0;
    for (const [v, n] of m) if (n > bestN) ((best = v), (bestN = n));
    return { best, bestN };
  };
  const work = topBy('작품', 'spectate');
  if (work.bestN >= 2) {
    cands.push({
      emoji: '🎭',
      title: tr({ en: `${work.bestN} views of ${work.best}`, ko: `〈${work.best}〉 ${work.bestN}번째 관람` }),
      sub: tr({ en: 'A favorite worth revisiting', ko: '다시 찾은 최애 작품' }),
    });
  }

  // 최다 관람 배우(2회 이상)
  const actorCounts = new Map<string, number>();
  for (const r of records) {
    if (r.template !== 'spectate') continue;
    const cast = r.fields?.출연진;
    if (!cast) continue;
    for (const entry of cast.split(/\s·\s|,/)) {
      const parts = entry.trim().split('·');
      const actor = parts[parts.length - 1].trim();
      if (actor) actorCounts.set(actor, (actorCounts.get(actor) ?? 0) + 1);
    }
  }
  let topActor = '';
  let topActorN = 0;
  for (const [a, n] of actorCounts) if (n > topActorN) ((topActor = a), (topActorN = n));
  if (topActorN >= 2) {
    cands.push({
      emoji: '⭐',
      title: tr({ en: `Saw ${topActor} ${topActorN} times`, ko: `${topActor} ${topActorN}번 관람` }),
      sub: tr({ en: 'Your most-watched performer', ko: '가장 많이 본 배우' }),
    });
  }

  // 이번 달 최장 거리
  const ym = today.slice(0, 7);
  const maxKm = Math.round(Math.max(0, ...records.filter((r) => r.template === 'endurance' && r.dateISO.startsWith(ym)).map(parseKm)) * 10) / 10;
  if (maxKm > 0) {
    cands.push({
      emoji: '🏃',
      title: tr({ en: `${maxKm}km — longest this month`, ko: `이번 달 최장 거리 ${maxKm}km` }),
      sub: tr({ en: 'Your farthest run this month', ko: '이번 달 가장 멀리 달린 기록' }),
    });
  }

  // 연속 기록(3일 이상)
  const streak = countStreak(new Set(records.map((r) => r.dateISO)), today);
  if (streak >= 3) {
    cands.push({
      emoji: '🔥',
      title: tr({ en: `${streak}-day streak`, ko: `${streak}일 연속 기록` }),
      sub: tr({ en: "Don't break the chain", ko: '흐름을 이어가 볼까요' }),
    });
  }

  // 누적 기록 마일스톤(5개 이상) — 다른 후보가 없을 때의 기본값 역할도.
  if (records.length >= 5) {
    cands.push({
      emoji: '📈',
      title: tr({ en: `${records.length} records so far`, ko: `지금까지 ${records.length}개 기록` }),
      sub: tr({ en: 'Every log adds up', ko: '차곡차곡 쌓이는 중' }),
    });
  }

  return cands;
}

// ==== 통계 개편 (허브 + 카테고리 세부) ====

export type StatsPeriod = 'month' | 'quarter' | 'year' | 'all';
export type StatsCategory = 'cardio' | 'strength' | 'match' | 'performance' | 'outing' | 'free';
const CATEGORY_TEMPLATE: Record<StatsCategory, TemplateType> = {
  cardio: 'endurance',
  strength: 'setrep',
  match: 'match',
  performance: 'spectate',
  outing: 'outing',
  free: 'free',
};
// 캠핑 등 기간 기록의 박 수(dateISO ~ fields.마지막일).
const isoPlusDays = (fromISO: string, i: number) => isoMinusDays(fromISO, -i);
const parseVolumeKg = (s?: string) => (s ? parseFloat(s.replace(/[^0-9.]/g, '')) || 0 : 0); // "4,250kg" → 4250

// 기간 범위 + 라벨. month=이번 달, quarter=이번 분기, year=올해.
export function periodRange(period: StatsPeriod, today: string): { start: string; end: string; tag: string } {
  const y = +today.slice(0, 4);
  const m = +today.slice(5, 7);
  const p = (n: number) => String(n).padStart(2, '0');
  const lastDay = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  if (period === 'all') return { start: '0000-01-01', end: '9999-12-31', tag: tr({ en: 'All', ko: '전체' }) };
  if (period === 'year') return { start: `${y}-01-01`, end: `${y}-12-31`, tag: tr({ en: 'This year', ko: '올해' }) };
  if (period === 'quarter') {
    const q = Math.floor((m - 1) / 3);
    const sm = q * 3 + 1;
    const em = sm + 2;
    return { start: `${y}-${p(sm)}-01`, end: `${y}-${p(em)}-${p(lastDay(y, em))}`, tag: tr({ en: `Q${q + 1}`, ko: `${q + 1}분기` }) };
  }
  return { start: `${y}-${p(m)}-01`, end: `${y}-${p(m)}-${p(lastDay(y, m))}`, tag: tr({ en: `${m}M`, ko: `${m}월` }) };
}

// 최근 5주(35일, 주=일요일 시작) 일별 활동 셀. level 0–3.
function heatmapCells(records: StoredRecord[], today: string) {
  const counts = new Map<string, number>();
  for (const r of records) counts.set(r.dateISO, (counts.get(r.dateISO) ?? 0) + 1);
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const thisSunday = isoMinusDays(today, dow);
  const start = isoMinusDays(thisSunday, 28); // 이번 주 포함 5주
  const cells: { date: string; level: number; future: boolean }[] = [];
  for (let i = 0; i < 35; i++) {
    const date = isoPlusDays(start, i);
    const n = counts.get(date) ?? 0;
    cells.push({ date, level: n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3, future: date > today });
  }
  return cells;
}

// 허브: 기간 요약 + 히트맵.
export function statsHub(records: StoredRecord[], period: StatsPeriod, today: string) {
  const { start, end, tag } = periodRange(period, today);
  const inRange = records.filter((r) => r.dateISO >= start && r.dateISO <= end);
  const count = inRange.length;
  const activeDays = new Set(inRange.map((r) => r.dateISO)).size;
  const streak = countStreak(new Set(records.map((r) => r.dateISO)), today);

  return { tag, count, activeDays, streak, heatmap: heatmapCells(records, today) };
}

// 단독 세부 화면의 "최신순 기록" 리스트. 기간·(옵션)종목으로 좁혀 날짜 내림차순.
export function recentRecords(
  records: StoredRecord[],
  category: StatsCategory,
  period: StatsPeriod,
  today: string,
  activity?: string,
): StoredRecord[] {
  const tpl = CATEGORY_TEMPLATE[category];
  const { start, end } = periodRange(period, today);
  return records
    .filter((r) => r.template === tpl && (!activity || r.activity === activity) && r.dateISO >= start && r.dateISO <= end)
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

// 단독 세부 화면의 리치 섹션(요약 스트립 · 랭킹 카드 · 2단 카드). 있는 필드로만 집계.
export type RankRow = { name: string; count: number; pct: number };
export type SubtypeSections = {
  summary: { label: string; value: string; unit?: string }[];
  rank: { title: string; caption?: string; rows: RankRow[] } | null;
  cols: { title: string; rows: { label: string; value: string }[] }[];
};
export function subtypeSections(records: StoredRecord[], category: StatsCategory, activity: string, period: StatsPeriod, today: string): SubtypeSections {
  const rs = recentRecords(records, category, period, today, activity);
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  // 임의 getter로 그룹 카운트 → 게이지 pct(최댓값 100%).
  const rankBy = (get: (r: StoredRecord) => string | undefined | null): RankRow[] => {
    const m = new Map<string, number>();
    for (const r of rs) {
      const k = get(r);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...arr.map(([, n]) => n));
    return arr.map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
  };
  const actorRank = (): RankRow[] => {
    const m = new Map<string, number>();
    for (const r of rs) {
      const cast = r.fields?.출연진;
      if (!cast) continue;
      for (const entry of cast.split(/\s·\s|,/)) {
        const parts = entry.trim().split('·');
        const actor = parts[parts.length - 1].trim();
        if (actor) m.set(actor, (m.get(actor) ?? 0) + 1);
      }
    }
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...arr.map(([, n]) => n));
    return arr.map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
  };
  const weekdayCol = () =>
    rankBy((r) => wd[new Date(Date.parse(r.dateISO + 'T00:00:00Z')).getUTCDay()] + tr({ en: '', ko: '요일' }))
      .slice(0, 3)
      .map((x) => ({ label: x.name, value: tr({ en: `${x.count}×`, ko: `${x.count}회` }) }));
  const toCol = (rows: RankRow[], unit: { en: string; ko: string }) =>
    rows.slice(0, 3).map((x) => ({ label: x.name, value: tr({ en: `${x.count}${unit.en}`, ko: `${x.count}${unit.ko}` }) }));
  const times = { en: '×', ko: '회' };

  if (category === 'performance') {
    const rated = rs.map((r) => r.rating).filter((x): x is number => !!x);
    const works = rankBy((r) => r.fields?.작품);
    return {
      summary: [
        { label: tr({ en: 'Watched', ko: '관람' }), value: String(rs.length), unit: tr({ en: 'shows', ko: '편' }) },
        { label: tr({ en: 'Avg rating', ko: '평점' }), value: rated.length ? String(Math.round(avg(rated) * 10) / 10) : '—' },
      ],
      rank: null,
      cols: [
        { title: tr({ en: 'Rewatch', ko: '재관람' }), rows: toCol(works, times) },
        { title: tr({ en: 'Top actors', ko: '본 배우' }), rows: toCol(actorRank(), times) },
      ],
    };
  }
  if (category === 'cardio') {
    const totalKm = Math.round(rs.reduce((a, r) => a + parseKm(r), 0) * 10) / 10;
    const speeds = rs.map(parseSpeed).filter((x): x is number => x != null);
    return {
      summary: [
        { label: tr({ en: 'Count', ko: '횟수' }), value: String(rs.length), unit: tr({ en: '×', ko: '회' }) },
        { label: tr({ en: 'Distance', ko: '거리' }), value: String(totalKm), unit: 'km' },
        { label: tr({ en: 'Avg speed', ko: '평균 속도' }), value: speeds.length ? avg(speeds).toFixed(1) : '—', unit: speeds.length ? 'km/h' : undefined },
      ],
      rank: { title: tr({ en: 'By course', ko: '코스별' }), rows: rankBy((r) => r.fields?.장소) },
      cols: [{ title: tr({ en: 'Top weekday', ko: '요일 TOP' }), rows: weekdayCol() }],
    };
  }
  if (category === 'strength') {
    const totalT = Math.round((rs.reduce((a, r) => a + parseVolumeKg(r.fields?.총볼륨), 0) / 1000) * 10) / 10;
    return {
      summary: [
        { label: tr({ en: 'Count', ko: '횟수' }), value: String(rs.length), unit: tr({ en: '×', ko: '회' }) },
        { label: tr({ en: 'Volume', ko: '볼륨' }), value: String(totalT), unit: 't' },
      ],
      rank: { title: tr({ en: 'By body part', ko: '부위별' }), rows: rankBy((r) => r.fields?.부위) },
      cols: [{ title: tr({ en: 'Top weekday', ko: '요일 TOP' }), rows: weekdayCol() }],
    };
  }
  if (category === 'outing') {
    const regions = rankBy((r) => r.fields?.지역?.trim());
    return {
      summary: [
        { label: tr({ en: 'Records', ko: '총 기록' }), value: String(rs.length), unit: tr({ en: '×', ko: '회' }) },
        { label: tr({ en: 'Regions', ko: '지역' }), value: String(regions.length), unit: tr({ en: '', ko: '곳' }) },
      ],
      rank: { title: tr({ en: 'By region', ko: '지역별' }), rows: regions },
      cols: [{ title: tr({ en: 'Frequent spots', ko: '자주 간 곳' }), rows: toCol(rankBy((r) => r.fields?.장소), times) }],
    };
  }
  // match · free — 요일 TOP만.
  return {
    summary: [{ label: tr({ en: 'Records', ko: '총 기록' }), value: String(rs.length), unit: tr({ en: '×', ko: '회' }) }],
    rank: null,
    cols: [{ title: tr({ en: 'Top weekday', ko: '요일 TOP' }), rows: weekdayCol() }],
  };
}

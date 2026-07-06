import { TemplateType } from '../theme/tokens';
import { StoredPlan, StoredRecord } from './types';
import { tr } from '../i18n/i18n';

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

export type StatsFilter = 'all' | TemplateType;

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
// "5′14″" → seconds. Tolerates ' and " variants.
const parsePaceSec = (r: StoredRecord): number | null => {
  const p = r.fields?.페이스;
  if (!p) return null;
  const m = p.match(/(\d+)\D+(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
export const formatPace = (sec: number) => `${Math.floor(sec / 60)}′${String(Math.round(sec % 60)).padStart(2, '0')}″`;
const monthDayLabel = (dateISO: string) => `${+dateISO.slice(5, 7)}월 ${+dateISO.slice(8, 10)}일`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Derive the 회고 screen's numbers live from records, scoped by filter.
export function statsSummary(records: StoredRecord[], filter: StatsFilter, today: string) {
  const filtered = filter === 'all' ? records : records.filter((r) => r.template === filter);

  // 연속 기록 streak (filtered days ending today, 하루 유예 포함).
  const days = new Set(filtered.map((r) => r.dateISO));
  const streak = countStreak(days, today);

  // 유산소 거리 집계 (전체/유산소에서만 의미).
  const endur = filtered.filter((r) => r.template === 'endurance');
  const totalKm = Math.round(endur.reduce((a, r) => a + parseKm(r), 0) * 10) / 10;

  // 최근 5개월 월별 거리 (오늘 달 포함), 막대 높이 20–84px 스케일.
  const ty = +today.slice(0, 4);
  const tm = +today.slice(5, 7);
  const yearPrefix = `${ty}-`; // "올해" 집계용(count·spectateCount)
  const window: { y: number; m: number }[] = [];
  for (let k = 4; k >= 0; k--) {
    const m0 = tm - 1 - k;
    window.push({ y: ty + Math.floor(m0 / 12), m: ((m0 % 12) + 12) % 12 + 1 });
  }
  const monthKm = window.map(({ y, m }) => {
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    const km = endur.filter((r) => r.dateISO.startsWith(prefix)).reduce((a, r) => a + parseKm(r), 0);
    return { month: String(m), km: Math.round(km * 10) / 10, active: y === ty && m === tm };
  });
  const maxMonthKm = Math.max(1, ...monthKm.map((x) => x.km));
  const monthly = monthKm.map((x) => ({
    ...x,
    height: x.km > 0 ? Math.round(20 + (x.km / maxMonthKm) * 64) : 4,
  }));

  // 최장 거리 + 날짜.
  let maxKm = 0;
  let maxDate = '';
  for (const r of endur) {
    const km = parseKm(r);
    if (km > maxKm) {
      maxKm = km;
      maxDate = r.dateISO;
    }
  }

  // 평균 페이스 + 전월 대비 변화(초).
  const paceOf = (recs: StoredRecord[]) =>
    recs.map(parsePaceSec).filter((x): x is number => x != null);
  const allPace = paceOf(endur);
  const avgPaceSec = allPace.length ? Math.round(avg(allPace)) : null;
  const thisPrefix = `${ty}-${String(tm).padStart(2, '0')}`;
  const pm0 = tm - 2;
  const prevPrefix = `${ty + Math.floor(pm0 / 12)}-${String(((pm0 % 12) + 12) % 12 + 1).padStart(2, '0')}`;
  const thisAvg = avg(paceOf(endur.filter((r) => r.dateISO.startsWith(thisPrefix))));
  const prevAvg = avg(paceOf(endur.filter((r) => r.dateISO.startsWith(prevPrefix))));
  const paceDeltaSec = thisAvg && prevAvg ? Math.round(prevAvg - thisAvg) : null; // +면 빨라짐

  // 공연 회고 (전체/공연).
  const spec = (filter === 'all' || filter === 'spectate') ? records.filter((r) => r.template === 'spectate') : [];
  const workCounts = new Map<string, number>();
  for (const r of spec) {
    const w = r.fields?.작품;
    if (w) workCounts.set(w, (workCounts.get(w) ?? 0) + 1);
  }
  let topWork = '';
  let topWorkCount = 0;
  for (const [w, n] of workCounts) if (n > topWorkCount) ((topWork = w), (topWorkCount = n));

  // 최다 배우 — fields.출연진 ("역·배우 · 역·배우" 또는 "배우 · 배우")에서 배우 토큰 집계.
  const actorCounts = new Map<string, number>();
  for (const r of spec) {
    const cast = r.fields?.출연진;
    if (!cast) continue;
    for (const entry of cast.split(/\s·\s|,/)) {
      const parts = entry.trim().split('·');
      const actor = parts[parts.length - 1].trim();
      if (actor) actorCounts.set(actor, (actorCounts.get(actor) ?? 0) + 1);
    }
  }
  let topActor = '';
  let topActorCount = 0;
  for (const [a, n] of actorCounts) if (n > topActorCount) ((topActor = a), (topActorCount = n));

  return {
    count: filtered.filter((r) => r.dateISO.startsWith(yearPrefix)).length,
    streak,
    hasDistance: endur.length > 0,
    totalKm,
    monthly,
    maxKm,
    maxDateLabel: maxDate ? monthDayLabel(maxDate) : '',
    avgPace: avgPaceSec != null ? formatPace(avgPaceSec) : null,
    paceDeltaSec,
    spectateCount: spec.filter((r) => r.dateISO.startsWith(yearPrefix)).length,
    topWork,
    topWorkCount,
    topActor,
    topActorCount,
  };
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
// 허브 표시 순서.
export const STATS_CATEGORIES: StatsCategory[] = ['cardio', 'strength', 'match', 'performance', 'outing', 'free'];

// 캠핑 등 기간 기록의 박 수(dateISO ~ fields.마지막일).
const nightsOf = (r: StoredRecord) => {
  const end = r.fields?.마지막일;
  if (!end) return 0;
  const s = Date.parse(r.dateISO + 'T00:00:00Z');
  const e = Date.parse(end + 'T00:00:00Z');
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / 86400000));
};

const isoPlusDays = (fromISO: string, i: number) => isoMinusDays(fromISO, -i);
const parseVolumeKg = (s?: string) => (s ? parseFloat(s.replace(/[^0-9.]/g, '')) || 0 : 0); // "4,250kg" → 4250
const parseDurSec = (s?: string) => {
  if (!s) return 0;
  const parts = s.split(':').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((a, p) => a * 60 + p, 0); // "27:12"→1632, "1:01:35"→3695
};

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

// 카테고리 최근 5개월 월별 건수(스파크라인/막대용).
function monthlyCounts(recs: StoredRecord[], today: string, valueOf?: (r: StoredRecord) => number) {
  const ty = +today.slice(0, 4);
  const tm = +today.slice(5, 7);
  const out: { month: number; value: number; active: boolean }[] = [];
  for (let k = 4; k >= 0; k--) {
    const m0 = tm - 1 - k;
    const y = ty + Math.floor(m0 / 12);
    const m = ((m0 % 12) + 12) % 12 + 1;
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    const inMonth = recs.filter((r) => r.dateISO.startsWith(prefix));
    const value = valueOf ? inMonth.reduce((a, r) => a + valueOf(r), 0) : inMonth.length;
    out.push({ month: m, value: Math.round(value * 10) / 10, active: y === ty && m === tm });
  }
  return out;
}

// 허브: 기간 요약 + 히트맵 + 카테고리 리스트.
export function statsHub(records: StoredRecord[], period: StatsPeriod, today: string) {
  const { start, end, tag } = periodRange(period, today);
  const inRange = records.filter((r) => r.dateISO >= start && r.dateISO <= end);
  const count = inRange.length;
  const activeDays = new Set(inRange.map((r) => r.dateISO)).size;
  const streak = countStreak(new Set(records.map((r) => r.dateISO)), today);

  const cats = STATS_CATEGORIES.map((key) => {
    const tpl = CATEGORY_TEMPLATE[key];
    const rs = inRange.filter((r) => r.template === tpl);
    let subtitle: string;
    if (key === 'cardio') {
      const km = Math.round(rs.reduce((a, r) => a + parseKm(r), 0) * 10) / 10;
      subtitle = tr({ en: `${rs.length}× · ${km}km`, ko: `${rs.length}회 · ${km}km` });
    } else if (key === 'strength') {
      const t = Math.round((rs.reduce((a, r) => a + parseVolumeKg(r.fields?.총볼륨), 0) / 1000) * 10) / 10;
      subtitle = tr({ en: `${rs.length}× · ${t}t`, ko: `${rs.length}회 · ${t}t` });
    } else if (key === 'match') {
      const rec = rs.filter((r) => r.fields?.결과).length;
      const w = rs.filter((r) => r.fields?.결과 === '승').length;
      subtitle =
        rec > 0
          ? tr({ en: `${rs.length}× · Win ${Math.round((w / rec) * 100)}%`, ko: `${rs.length}회 · 승률 ${Math.round((w / rec) * 100)}%` })
          : tr({ en: `${rs.length}×`, ko: `${rs.length}회` });
    } else if (key === 'performance') {
      const rated = rs.map((r) => r.rating).filter((x): x is number => !!x);
      const avgR = rated.length ? Math.round(avg(rated) * 10) / 10 : 0;
      subtitle = tr({
        en: `${rs.length}${avgR ? ` · ★ ${avgR}` : ''}`,
        ko: `${rs.length}편${avgR ? ` · 평점 ${avgR}` : ''}`,
      });
    } else if (key === 'outing') {
      const placeN = new Set(rs.map((r) => r.fields?.장소).filter(Boolean)).size;
      subtitle = tr({
        en: `${rs.length}×${placeN ? ` · ${placeN} places` : ''}`,
        ko: `${rs.length}회${placeN ? ` · ${placeN}곳` : ''}`,
      });
    } else {
      const bookN = new Set(rs.filter((r) => r.activity === '독서').map((r) => r.fields?.제목).filter(Boolean)).size;
      subtitle = tr({
        en: `${rs.length}×${bookN ? ` · ${bookN} books` : ''}`,
        ko: `${rs.length}회${bookN ? ` · 책 ${bookN}권` : ''}`,
      });
    }
    const spark = monthlyCounts(records.filter((r) => r.template === tpl), today).map((x) => x.value);
    return { key, template: tpl, count: rs.length, subtitle, spark };
  });

  return { tag, count, activeDays, streak, heatmap: heatmapCells(records, today), cats };
}

// 카테고리 세부 통계.
export function categoryStats(records: StoredRecord[], category: StatsCategory, period: StatsPeriod, today: string) {
  const tpl = CATEGORY_TEMPLATE[category];
  const { start, end } = periodRange(period, today);
  const all = records.filter((r) => r.template === tpl);
  const inRange = all.filter((r) => r.dateISO >= start && r.dateISO <= end);

  if (category === 'cardio') {
    const km = monthlyCounts(all, today, parseKm).map((x) => ({ month: x.month, km: x.value, active: x.active }));
    const totalKm = Math.round(inRange.reduce((a, r) => a + parseKm(r), 0) * 10) / 10;
    const paceSecs = inRange.map(parsePaceSec).filter((x): x is number => x != null);
    const avgPaceSec = paceSecs.length ? Math.round(avg(paceSecs)) : null;
    // 월별 평균 페이스(추이, 최근 5개월) — 값 없는 달은 null.
    const ty = +today.slice(0, 4);
    const tm = +today.slice(5, 7);
    const paceLine: { month: number; sec: number | null }[] = [];
    for (let k = 4; k >= 0; k--) {
      const m0 = tm - 1 - k;
      const y = ty + Math.floor(m0 / 12);
      const m = ((m0 % 12) + 12) % 12 + 1;
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      const secs = all
        .filter((r) => r.dateISO.startsWith(prefix))
        .map(parsePaceSec)
        .filter((x): x is number => x != null);
      paceLine.push({ month: m, sec: secs.length ? Math.round(avg(secs)) : null });
    }
    const hr = inRange.map((r) => parseVolumeKg(r.fields?.평균심박)).filter((x) => x > 0);
    const avgHr = hr.length ? Math.round(avg(hr)) : null;
    const maxKm = Math.max(0, ...inRange.map(parseKm));
    const totalSec = inRange.reduce((a, r) => a + parseDurSec(r.fields?.시간), 0);
    return {
      category,
      count: inRange.length,
      monthlyKm: km,
      totalKm,
      avgPace: avgPaceSec != null ? formatPace(avgPaceSec) : null,
      avgHr,
      maxKm: Math.round(maxKm * 10) / 10,
      totalHours: Math.round(totalSec / 360) / 10, // 시간(소수1)
      paceLine,
    };
  }

  if (category === 'strength') {
    const totalT = Math.round((inRange.reduce((a, r) => a + parseVolumeKg(r.fields?.총볼륨), 0) / 1000) * 10) / 10;
    const workouts = inRange.length;
    const partCounts = new Map<string, number>();
    for (const r of inRange) {
      const part = r.fields?.부위;
      if (part) partCounts.set(part, (partCounts.get(part) ?? 0) + 1);
    }
    const maxPart = Math.max(1, ...partCounts.values());
    const bodyParts = [...partCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([part, n]) => ({ part, count: n, pct: Math.round((n / maxPart) * 100) }));
    return { category, count: workouts, totalT, workouts, bodyParts };
  }

  if (category === 'match') {
    const wins = inRange.filter((r) => r.fields?.결과 === '승').length;
    const draws = inRange.filter((r) => r.fields?.결과 === '무').length;
    const losses = inRange.filter((r) => r.fields?.결과 === '패').length;
    const resultRecorded = wins + draws + losses;
    const winRate = resultRecorded ? Math.round((wins / resultRecorded) * 100) : 0;
    const bySportMap = new Map<string, number>();
    for (const r of inRange) bySportMap.set(r.activity, (bySportMap.get(r.activity) ?? 0) + 1);
    const bySport = [...bySportMap.entries()].sort((a, b) => b[1] - a[1]).map(([activity, count]) => ({ activity, count }));
    return { category, count: inRange.length, wins, draws, losses, resultRecorded, winRate, bySport };
  }

  if (category === 'outing') {
    const placeCount = new Set(inRange.map((r) => r.fields?.장소).filter(Boolean)).size;
    const totalNights = inRange.reduce((a, r) => a + nightsOf(r), 0);
    const byActMap = new Map<string, number>();
    for (const r of inRange) byActMap.set(r.activity, (byActMap.get(r.activity) ?? 0) + 1);
    const byActivity = [...byActMap.entries()].sort((a, b) => b[1] - a[1]).map(([activity, count]) => ({ activity, count }));
    return { category, count: inRange.length, placeCount, totalNights, byActivity };
  }

  if (category === 'free') {
    const books = inRange.filter((r) => r.activity === '독서');
    const bookCount = new Set(books.map((r) => r.fields?.제목).filter(Boolean)).size;
    const byActMap = new Map<string, number>();
    for (const r of inRange) byActMap.set(r.activity, (byActMap.get(r.activity) ?? 0) + 1);
    const byActivity = [...byActMap.entries()].sort((a, b) => b[1] - a[1]).map(([activity, count]) => ({ activity, count }));
    return { category, count: inRange.length, bookCount, byActivity };
  }

  // performance
  const count = inRange.length;
  const rated = inRange.map((r) => r.rating).filter((x): x is number => !!x);
  const avgRating = rated.length ? Math.round(avg(rated) * 10) / 10 : null;
  // 장르 분포 (activity별).
  const genreCounts = new Map<string, number>();
  for (const r of inRange) genreCounts.set(r.activity, (genreCounts.get(r.activity) ?? 0) + 1);
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre, n]) => ({ genre, count: n, pct: count ? Math.round((n / count) * 100) : 0 }));
  // 최다 작품/배우/극장.
  const top = (key: '작품' | '공연장') => {
    const m = new Map<string, number>();
    for (const r of inRange) {
      const v = r.fields?.[key];
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    let best = '';
    let bestN = 0;
    for (const [v, n] of m) if (n > bestN) ((best = v), (bestN = n));
    return { value: best, n: bestN };
  };
  const actorCounts = new Map<string, number>();
  for (const r of inRange) {
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
  const topWork = top('작품');
  const topVenue = top('공연장');
  return { category, count, avgRating, genres, topWork, topActor, topVenue };
}

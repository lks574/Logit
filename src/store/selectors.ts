import { TemplateType } from '../theme/tokens';
import { StoredPlan, StoredRecord } from './types';

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
  // streak: consecutive days ending today(하루 유예 포함) with ≥1 record.
  const streak = countStreak(new Set(records.map((r) => r.dateISO)), today);
  return { count, km: Math.round(km * 10) / 10, streak };
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

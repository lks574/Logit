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
  // streak: consecutive days ending today with ≥1 record.
  const days = new Set(records.map((r) => r.dateISO));
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(Date.parse(today + 'T00:00:00Z') - i * 86400000)
      .toISOString()
      .slice(0, 10);
    if (days.has(d)) streak++;
    else break;
  }
  return { count, km: Math.round(km * 10) / 10, streak };
}

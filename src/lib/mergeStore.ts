import type { StoredPlan, StoredRecord, StoreState } from '../store/types';

// 로컬 데이터와 클라우드 백업을 합친다(복원의 전체 교체와 달리 어느 쪽도 잃지 않는다).
//
// 규칙
// - 기록·약속: id 합집합. id는 `r-<시간36>-<난수36>`로 기기마다 난수가 달라 서로 다른
//   기기의 항목이 충돌하지 않는다. 같은 id면 로컬 우선 — 기록에 updatedAt이 없어 어느
//   쪽이 최신인지 알 수 없으므로 사용자가 보고 있는 기기를 신뢰한다.
// - id가 달라도 콘텐츠가 같으면 1개로 축약(두 기기에서 같은 걸 각각 입력한 경우).
// - id 합집합이라 여러 번 합쳐도 결과가 같다(idempotent).

export type MergeSummary = {
  addedRecords: number;
  addedPlans: number;
  addedActivities: number;
};

export const mergeTotal = (s: MergeSummary): number => s.addedRecords + s.addedPlans + s.addedActivities;

// fields는 키 순서가 달라도 같은 내용이면 같은 문자열이 되도록 키를 정렬해 직렬화한다.
function stableFields(fields?: Record<string, string>): string {
  if (!fields) return '';
  return Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join(',');
}

// 콘텐츠 동일성 키 — id·sync·photos는 제외한다.
// 사진 uri는 기기마다 다르고 백업에 파일이 포함되지 않아, 같은 기록도 서로 달라 보인다.
function recordKey(r: StoredRecord): string {
  return [
    r.activity,
    r.dateISO,
    r.endDateISO ?? '',
    r.timeLabel,
    r.meta ?? '',
    r.memo ?? '',
    r.rating ?? '',
    (r.companions ?? []).join('·'),
    stableFields(r.fields),
  ].join('|');
}

function planKey(p: StoredPlan): string {
  return [
    p.activity,
    p.dateISO,
    p.timeLabel ?? '',
    p.place ?? '',
    p.memo ?? '',
    p.reminder ? '1' : '',
    p.done ? '1' : '',
  ].join('|');
}

// ArchiveScreen과 같은 정렬(최신 우선). HomeScreen이 records 배열 순서로 '최근 기록'을
// 자르기 때문에, 합친 뒤 삽입순을 그대로 두면 과거 기록이 최근처럼 보인다.
function byNewest(a: StoredRecord, b: StoredRecord): number {
  if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? 1 : -1;
  return (b.timeLabel ?? '').localeCompare(a.timeLabel ?? '');
}

// 로컬을 먼저 채운 뒤, id도 콘텐츠도 겹치지 않는 항목만 뒤에 붙인다.
function unionBy<T>(
  local: T[],
  incoming: T[],
  idOf: (v: T) => string,
  keyOf: (v: T) => string,
): { merged: T[]; added: number } {
  const ids = new Set(local.map(idOf));
  const keys = new Set(local.map(keyOf));
  const merged = [...local];
  let added = 0;
  for (const v of incoming) {
    if (ids.has(idOf(v)) || keys.has(keyOf(v))) continue;
    ids.add(idOf(v));
    keys.add(keyOf(v));
    merged.push(v);
    added += 1;
  }
  return { merged, added };
}

export function mergeStoreStates(
  local: StoreState,
  incoming: StoreState,
): { next: StoreState; summary: MergeSummary } {
  const records = unionBy(local.records, incoming.records, (r) => r.id, recordKey);
  const plans = unionBy(local.plans, incoming.plans, (p) => p.id, planKey);
  const activities = unionBy(
    local.customActivities,
    incoming.customActivities,
    (a) => a.name,
    (a) => a.name,
  );

  const preferredActivities = [...local.preferredActivities];
  for (const name of incoming.preferredActivities) {
    if (!preferredActivities.includes(name)) preferredActivities.push(name);
  }

  const summary: MergeSummary = {
    addedRecords: records.added,
    addedPlans: plans.added,
    addedActivities: activities.added,
  };

  const next: StoreState = {
    records: records.merged.sort(byNewest),
    plans: plans.merged,
    customActivities: activities.merged,
    // 프로필 신원은 로그인 계정 기준(App.tsx AuthProfileSync)이라 로컬 우선.
    // 체중은 계정과 무관한 로컬 설정이라 로컬이 비었을 때만 백업에서 채운다.
    profile: { ...local.profile, weightKg: local.profile.weightKg ?? incoming.profile.weightKg },
    onboardingComplete: local.onboardingComplete || incoming.onboardingComplete,
    preferredActivities,
    // 합친 결과는 클라우드 백업과 다르므로 '백업 필요'로 되돌린다.
    // 새로 들어온 게 없으면 로컬 = 합친 결과라 기존 동기화 상태를 유지한다.
    backupSignature: mergeTotal(summary) > 0 ? null : local.backupSignature,
  };

  return { next, summary };
}

// "기록 2개 · 약속 1개" 식 요약 — 0인 항목은 빼고, 전부 0이면 null.
export function summaryText(
  s: MergeSummary,
  labels: { records: string; plans: string; activities: string },
): string | null {
  const parts: string[] = [];
  if (s.addedRecords) parts.push(`${labels.records} ${s.addedRecords}`);
  if (s.addedPlans) parts.push(`${labels.plans} ${s.addedPlans}`);
  if (s.addedActivities) parts.push(`${labels.activities} ${s.addedActivities}`);
  return parts.length ? parts.join(' · ') : null;
}

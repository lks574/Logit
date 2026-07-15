// 근력(setrep) 다종목 로거 데이터. 한 기록 = 여러 종목, 종목마다 이름 + 세트[].
// 저장: fields.운동 = JSON([{ name, sets:[{reps,weight,warmup}] }]).
// 레거시 호환: 구 fields.세트(단일 종목, 이름 없음)는 읽을 때 1종목으로 마이그레이션.

export type StrengthSet = { reps: string; weight: string; warmup: boolean };
export type Exercise = { name: string; sets: StrengthSet[] };

export const emptySet = (): StrengthSet => ({ reps: '', weight: '', warmup: false });
export const emptyExercise = (name = ''): Exercise => ({ name, sets: [emptySet()] });

const toSet = (s: any): StrengthSet => ({
  reps: String(s?.reps ?? ''),
  weight: String(s?.weight ?? ''),
  warmup: !!s?.warmup,
});

// fields → 종목 배열. 신규(운동) 우선, 없으면 레거시(세트) 마이그레이션, 둘 다 없으면 빈 1종목.
export function parseExercises(fields?: Record<string, string>): Exercise[] {
  if (fields?.운동) {
    try {
      const arr = JSON.parse(fields.운동);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((e) => ({
          name: String(e?.name ?? ''),
          sets: Array.isArray(e?.sets) && e.sets.length ? e.sets.map(toSet) : [emptySet()],
        }));
      }
    } catch {}
  }
  if (fields?.세트) {
    try {
      const arr = JSON.parse(fields.세트);
      if (Array.isArray(arr) && arr.length) {
        return [{ name: fields?.부위 ?? '', sets: arr.map(toSet) }]; // 이름은 부위로 폴백
      }
    } catch {}
  }
  return [emptyExercise()];
}

// 총 볼륨 = Σ(반복 × 중량), 워밍업 제외.
export function totalVolume(exercises: Exercise[]): number {
  return exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, r) => (r.warmup ? s : s + (parseFloat(r.reps) || 0) * (parseFloat(r.weight) || 0)), 0),
    0,
  );
}

// 저장 전 정리 — 빈 세트 제거, 이름·세트 둘 다 빈 종목 제거.
export function cleanExercises(exercises: Exercise[]): Exercise[] {
  return exercises
    .map((e) => ({ name: e.name.trim(), sets: e.sets.filter((s) => s.reps.trim() !== '' || s.weight.trim() !== '') }))
    .filter((e) => e.name !== '' || e.sets.length > 0);
}

// 과거 setrep 기록에서 종목을 최근 사용순으로 추출(이름 중복 제거) — "최근 종목" 칩 제안용.
// 각 항목은 그 종목의 마지막 세트 구성을 담아 종목 단위 프리필에 쓴다(관리 화면 없는 라이브러리).
// records는 스토어 순서(최신순) 그대로 넘길 것.
export function recentExercises(
  records: { template: string; fields?: Record<string, string> }[],
  limit = 8,
): Exercise[] {
  const out: Exercise[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    if (r.template !== 'setrep' || !r.fields?.운동) continue;
    let parsed: any;
    try {
      parsed = JSON.parse(r.fields.운동);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;
    for (const e of parsed) {
      const name = String(e?.name ?? '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, sets: Array.isArray(e?.sets) && e.sets.length ? e.sets.map(toSet) : [emptySet()] });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

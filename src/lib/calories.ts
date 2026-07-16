// 러닝 소모 칼로리 추정 — 런닝머신과 동일한 ACSM 대사 방정식.
//   VO2(ml/kg/min) = 0.2·S + 0.9·S·G + 3.5   (S = 속도 m/min, G = 경사 분수)
//   kcal = VO2 × 체중(kg) × 시간(min) × 5 / 1000   (산소 1L ≈ 5kcal)
// 경사(G)는 고도 상승 ÷ 거리로 근사(도로 러닝엔 총 상승만 있어 약간 과대추정될 수 있음).
// 체중이 없거나 거리·시간이 0이면 계산 불가(null).
export function runningCalories(p: {
  km: number;
  totalSec: number;
  elevationM?: number;
  weightKg?: number;
}): number | null {
  const { km, totalSec, elevationM, weightKg } = p;
  if (!weightKg || weightKg <= 0 || km <= 0 || totalSec <= 0) return null;
  const timeMin = totalSec / 60;
  const speedMPerMin = (km * 1000) / timeMin;
  const grade = elevationM && elevationM > 0 ? elevationM / (km * 1000) : 0;
  const vo2 = 0.2 * speedMPerMin + 0.9 * speedMPerMin * grade + 3.5; // ml/kg/min
  const kcal = (vo2 * weightKg * timeMin * 5) / 1000;
  return Math.round(kcal);
}

// MET 기반 공통식: kcal = MET × 체중(kg) × 시간(h). (Compendium of Physical Activities)
function metCalories(met: number, weightKg?: number, totalSec?: number): number | null {
  if (!weightKg || weightKg <= 0 || !totalSec || totalSec <= 0) return null;
  return Math.round(met * weightKg * (totalSec / 3600));
}

// 자전거 — 속도(km/h) 구간별 MET. 파워미터 없이 속도만으로 추정하는 표준 근사.
export function cyclingCalories(p: { km: number; totalSec: number; weightKg?: number }): number | null {
  const { km, totalSec, weightKg } = p;
  if (km <= 0 || totalSec <= 0) return null;
  const kmh = km / (totalSec / 3600);
  const met = kmh < 16 ? 4 : kmh < 19 ? 6 : kmh < 22 ? 8 : kmh < 25 ? 10 : kmh < 30 ? 12 : 15.8;
  return metCalories(met, weightKg, totalSec);
}

// 수영 — 영법 × 강도(100m 페이스) MET. stroke 미지정 시 자유형 기준.
export function swimCalories(p: {
  meters: number;
  totalSec: number;
  weightKg?: number;
  stroke?: string;
}): number | null {
  const { meters, totalSec, weightKg, stroke } = p;
  if (meters <= 0 || totalSec <= 0) return null;
  const secPer100 = (totalSec * 100) / meters;
  const vigorous = secPer100 < 120; // 100m 2분 미만이면 고강도
  // [보통, 고강도] MET — 자유형/배영/평영/접영.
  const table: Record<string, [number, number]> = {
    자유형: [6, 10],
    배영: [5, 9.5],
    평영: [6, 10.3],
    접영: [11, 13.8],
  };
  const [mod, vig] = table[stroke ?? '자유형'] ?? table['자유형'];
  return metCalories(vigorous ? vig : mod, weightKg, totalSec);
}

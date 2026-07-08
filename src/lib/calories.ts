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

import { runningCalories, cyclingCalories, swimCalories } from '../lib/calories';

// 유산소(endurance) 종목 프로파일 — 하나의 EnduranceForm이 종목별로 UI·칼로리를 바꾼다.
// MatchForm이 sports.ts 스키마로 슬롯을 교체하는 것과 같은 패턴.
//  - 자전거: km·km/h·고도 O, MET 칼로리
//  - 수영:  m·100m 페이스·고도 X·영법, MET 칼로리
//  - 그 외(런닝·걷기·커스텀): km·km/h·고도 O, ACSM 러닝 칼로리

export type EnduranceKind = 'run' | 'bike' | 'swim';

export type CalorieInput = { km: number; totalSec: number; elevationM?: number; weightKg?: number; stroke?: string };

export type EnduranceProfile = {
  kind: EnduranceKind;
  distanceUnit: 'km' | 'm'; // 저장·표시 단위
  showElevation: boolean;
  showStroke: boolean; // 수영 영법 칩
  calories: (p: CalorieInput) => number | null;
};

const RUN: EnduranceProfile = {
  kind: 'run',
  distanceUnit: 'km',
  showElevation: true,
  showStroke: false,
  calories: ({ km, totalSec, elevationM, weightKg }) => runningCalories({ km, totalSec, elevationM, weightKg }),
};

const BIKE: EnduranceProfile = {
  kind: 'bike',
  distanceUnit: 'km',
  showElevation: true,
  showStroke: false,
  calories: ({ km, totalSec, weightKg }) => cyclingCalories({ km, totalSec, weightKg }),
};

const SWIM: EnduranceProfile = {
  kind: 'swim',
  distanceUnit: 'm',
  showElevation: false,
  showStroke: true,
  calories: ({ km, totalSec, weightKg, stroke }) => swimCalories({ meters: km * 1000, totalSec, weightKg, stroke }),
};

// 진입 활동 이름으로 프로파일 결정. 빌트인 자전거/수영만 특화, 나머지는 러닝 기본.
export function enduranceProfile(activity: string): EnduranceProfile {
  if (activity === '자전거') return BIKE;
  if (activity === '수영') return SWIM;
  return RUN;
}

export const SWIM_STROKES = ['자유형', '배영', '평영', '접영', '혼합'] as const;

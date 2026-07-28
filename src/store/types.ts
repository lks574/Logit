import { TemplateType } from '../theme/tokens';

// Data model (README §정보구조). Kept flat + display-friendly: each record/plan
// carries its activity name (→ registry for icon/template/color) plus a
// one-line `meta` for cards and a flexible `fields` map for template values.

export type StoredRecord = {
  id: string;
  activity: string; // activity name → activities registry
  template: TemplateType;
  dateISO: string; // YYYY-MM-DD (calendar day) — 멀티데이면 시작일
  endDateISO?: string; // 멀티데이 기록(캠핑·여행 등)의 종료일. 없거나 시작일과 같으면 하루.
  timeLabel: string; // e.g. "오후 6:30" / "어제"
  meta?: string; // one-line card meta e.g. "한강공원 · 5.2km · 27′12″"
  rating?: number;
  companions?: string[];
  photos?: string[]; // image uris
  memo?: string;
  fields?: Record<string, string>; // templateFields (거리/시간/스코어…)
  sync: 'synced' | 'pending';
};

export type StoredPlan = {
  id: string;
  activity: string;
  template: TemplateType;
  dateISO: string; // YYYY-MM-DD
  timeLabel?: string; // e.g. "오후 8:00" — 미정이면 없음
  place?: string;
  memo?: string;
  reminder?: boolean;
  done?: boolean;
  // 기록으로 전환하며 완료된 약속이 낳은 기록의 id. 완료 약속을 "죽은 항목"이 아니라
  // 그 기록으로 가는 입구로 쓴다. 기록 쪽에 역참조를 두지 않는 이유는 기록이 백업의
  // 대부분을 차지하는 큰 엔티티라, 링크를 완료 시 한 번 갱신되는 약속에 두는 게 싸다.
  recordId?: string;
};

// User-defined activity (builtin catalog lives in data/activities.ts).
export type CustomActivity = {
  name: string;
  template: TemplateType;
};

// Local-only user profile (no auth/backend — see PROGRESS.md 회원 결정).
export type Profile = {
  name: string;
  email: string;
  weightKg?: number; // 러닝 칼로리 자동 계산용 체중(kg)
};

export type StoreState = {
  records: StoredRecord[];
  plans: StoredPlan[];
  customActivities: CustomActivity[];
  profile: Profile;
  onboardingComplete: boolean; // 가입 직후 온보딩 1회 노출 게이팅
  preferredActivities: string[]; // 온보딩에서 고른 활동 → 홈 우선 노출(후속)
  // 마지막 클라우드 백업 시점 데이터의 서명(로컬 전용, 백업 envelope에는 미포함).
  // 현재 데이터 서명과 다르면 "동기화 안됨". null이면 아직 백업한 적 없음.
  backupSignature?: string | null;
};

import { TemplateType } from '../theme/tokens';

// Data model (README §정보구조). Kept flat + display-friendly: each record/plan
// carries its activity name (→ registry for icon/template/color) plus a
// one-line `meta` for cards and a flexible `fields` map for template values.

export type StoredRecord = {
  id: string;
  activity: string; // activity name → activities registry
  template: TemplateType;
  dateISO: string; // YYYY-MM-DD (calendar day)
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
  timeLabel: string; // e.g. "오후 8:00"
  place?: string;
  memo?: string;
  reminder?: boolean;
  done?: boolean;
};

// User-defined activity (builtin catalog lives in data/activities.ts).
export type CustomActivity = {
  name: string;
  template: TemplateType;
};

export type StoreState = {
  records: StoredRecord[];
  plans: StoredPlan[];
  customActivities: CustomActivity[];
};

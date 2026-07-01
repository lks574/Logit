import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { seed, TODAY } from './seed';
import { CustomActivity, StoredPlan, StoredRecord, StoreState } from './types';

// Offline-first store: single source of truth in memory, persisted to
// AsyncStorage (last-write-wins). New records land as `pending` then flip to
// `synced` after a short delay to surface the SyncStatusBadge lifecycle
// (real backend sync is a follow-up — README §State Management).
// ponytail: AsyncStorage + Context instead of SQLite/WatermelonDB — swap the
// persistence layer here if the dataset outgrows a single JSON blob.

const KEY = 'logit.store.v1';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

type StoreValue = {
  ready: boolean;
  today: string;
  records: StoredRecord[];
  plans: StoredPlan[];
  customActivities: CustomActivity[];
  addRecord: (r: Omit<StoredRecord, 'id' | 'sync'>) => StoredRecord;
  addPlan: (p: Omit<StoredPlan, 'id'>) => StoredPlan;
  addActivity: (a: CustomActivity) => void;
  completePlan: (id: string) => void;
  completePlanAsRecord: (id: string) => StoredRecord | null;
  updateRecord: (id: string, patch: Partial<Omit<StoredRecord, 'id'>>) => void;
  updatePlan: (id: string, patch: Partial<Omit<StoredPlan, 'id'>>) => void;
  deletePlan: (id: string) => void;
  deleteRecord: (id: string) => void;
  getRecord: (id: string) => StoredRecord | undefined;
  getPlan: (id: string) => StoredPlan | undefined;
};

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(seed);
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Rehydrate once.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive && raw) setState(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // Persist on change (after ready, so we don't clobber before rehydrate).
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = useMemo<StoreValue>(() => {
    const markSynced = (id: string) => {
      const t = setTimeout(() => {
        setState((s) => ({
          ...s,
          records: s.records.map((r) => (r.id === id ? { ...r, sync: 'synced' } : r)),
        }));
      }, 1500);
      timers.current.push(t);
    };

    return {
      ready,
      today: TODAY,
      records: state.records,
      plans: state.plans,
      customActivities: state.customActivities,
      addRecord: (r) => {
        const rec: StoredRecord = { ...r, id: uid('r'), sync: 'pending' };
        setState((s) => ({ ...s, records: [rec, ...s.records] }));
        markSynced(rec.id);
        return rec;
      },
      addPlan: (p) => {
        const plan: StoredPlan = { ...p, id: uid('p') };
        setState((s) => ({ ...s, plans: [...s.plans, plan] }));
        return plan;
      },
      addActivity: (a) => {
        setState((s) =>
          s.customActivities.some((x) => x.name === a.name)
            ? s
            : { ...s, customActivities: [...s.customActivities, a] }
        );
      },
      completePlan: (id) => {
        setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === id ? { ...p, done: true } : p)) }));
      },
      // 약속 → 기록 전환: 약속을 완료 처리하면서 그 정보로 새 Record를 생성한다.
      // (README: "약속 카드의 체크 버튼 → 완료(기록으로 전환) 흐름") 세부 수치는
      // 비어있는 채로 생성되고, 사용자가 상세에서 수정으로 채울 수 있다.
      completePlanAsRecord: (id) => {
        const plan = state.plans.find((p) => p.id === id);
        if (!plan || plan.done) return null;
        const rec: StoredRecord = {
          id: uid('r'),
          activity: plan.activity,
          template: plan.template,
          dateISO: plan.dateISO,
          timeLabel: plan.timeLabel,
          meta: plan.place || undefined,
          memo: plan.memo,
          photos: [],
          sync: 'pending',
        };
        setState((s) => ({
          ...s,
          records: [rec, ...s.records],
          plans: s.plans.map((p) => (p.id === id ? { ...p, done: true } : p)),
        }));
        markSynced(rec.id);
        return rec;
      },
      updateRecord: (id, patch) => {
        setState((s) => ({
          ...s,
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
      },
      updatePlan: (id, patch) => {
        setState((s) => ({
          ...s,
          plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },
      deletePlan: (id) => {
        setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
      },
      deleteRecord: (id) => {
        setState((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
      },
      getRecord: (id) => state.records.find((r) => r.id === id),
      getPlan: (id) => state.plans.find((p) => p.id === id),
    };
  }, [state, ready]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}

// Sync badge state: any pending record → 'pending', else 'synced'.
export function useSyncState(): 'synced' | 'pending' | 'offline' {
  const { records } = useStore();
  return records.some((r) => r.sync === 'pending') ? 'pending' : 'synced';
}

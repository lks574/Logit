import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { seed } from './seed';
import { deletePhoto } from '../lib/photos';
import { nowDateISO } from '../lib/date';
import { CustomActivity, Profile, StoredPlan, StoredRecord, StoreState } from './types';

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
  persistError: boolean; // 마지막 저장이 실패했는지(저장 공간 부족 등) → 전역 배너
  today: string;
  records: StoredRecord[];
  plans: StoredPlan[];
  customActivities: CustomActivity[];
  profile: Profile;
  onboardingComplete: boolean;
  preferredActivities: string[];
  completeOnboarding: (selected: string[]) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  replaceAll: (next: StoreState) => Promise<void>;
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
  const [persistError, setPersistError] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completing = useRef<Set<string>>(new Set()); // 약속→기록 전환 in-flight 가드(더블탭)

  // Rehydrate once.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        // Merge over seed so blobs written before a field existed (e.g. profile)
        // pick up its default instead of becoming undefined.
        if (raw) setState({ ...seed, ...JSON.parse(raw) });
        // ready는 읽기/파싱 성공(빈 저장소 포함) 시에만 올린다. 실패 시 올리지 않아야
        // persist effect가 메모리의 seed로 사용자의 실제 blob을 덮어쓰지 않는다.
        setReady(true);
      })
      .catch(() => {
        // getItem reject / JSON.parse throw: ready를 올리지 않고 다음 실행에서 재시도.
      });
    return () => {
      alive = false;
    };
  }, []);

  // Persist on change (after ready, so we don't clobber before rehydrate).
  // 저장 실패는 persistError로 노출 — 무음 삼킴은 다음 실행 때 데이터 유실로 이어진다.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state))
      .then(() => setPersistError(false))
      .catch((e) => {
        console.warn('[store] persist 실패', e);
        setPersistError(true);
      });
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
      persistError,
      today: nowDateISO(), // 실제 현재 날짜(과거 mock TODAY 대체) — 홈·통계·캘린더 일관

      records: state.records,
      plans: state.plans,
      customActivities: state.customActivities,
      profile: state.profile,
      onboardingComplete: state.onboardingComplete,
      preferredActivities: state.preferredActivities,
      completeOnboarding: (selected) => {
        setState((s) => ({ ...s, onboardingComplete: true, preferredActivities: selected }));
      },
      updateProfile: (patch) => {
        setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
      },
      // 가져오기(전체 교체): 검증된 StoreState로 통째 대체한다. seed 병합은 하지 않는다
      // (가져온 파일이 유일 진실).
      replaceAll: async (next) => {
        // 교체로 참조가 끊기는 사진 파일 정리(고아 방지). 우리 소유 상대경로만 삭제.
        const kept = new Set(next.records.flatMap((r) => r.photos ?? []));
        state.records.forEach((r) => r.photos?.forEach((u) => (kept.has(u) ? null : deletePhoto(u))));
        setState(next);
        // 즉시 영속하고 실패를 호출측에 전달 — persist effect의 무음 저장에 기대지 않아
        // "가져오기 완료"가 미저장인데도 뜨는 것을 막는다.
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
      },
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
        // stale-closure state로 done을 검사하므로, 렌더 전 연타를 in-flight ref로 막는다.
        if (!plan || plan.done || completing.current.has(id)) return null;
        completing.current.add(id);
        const rec: StoredRecord = {
          id: uid('r'),
          activity: plan.activity,
          template: plan.template,
          dateISO: plan.dateISO,
          timeLabel: plan.timeLabel ?? '',
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
        // 이 레코드가 소유한 사진 파일 정리(고아 파일 방지). best-effort.
        state.records.find((r) => r.id === id)?.photos?.forEach(deletePhoto);
        setState((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
      },
      getRecord: (id) => state.records.find((r) => r.id === id),
      getPlan: (id) => state.plans.find((p) => p.id === id),
    };
  }, [state, ready, persistError]);

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

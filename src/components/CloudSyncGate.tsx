import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionSheet } from './ActionSheet';
import { useAuth } from '../auth/AuthContext';
import { syncSignature, useStore } from '../store/StoreContext';
import { fetchBackup } from '../lib/cloudBackup';
import { mergeStoreStates, mergeTotal, summaryText, type MergeSummary } from '../lib/mergeStore';
import { tr } from '../i18n/i18n';
import type { StoreState } from '../store/types';

// 로그인 시점에 로컬 데이터와 클라우드 백업을 맞춰주는 게이트.
//
// - 로컬이 비어 있으면(새 기기·브라우저) 마지막 백업을 1회 자동 복원한다.
// - 로컬에 이미 데이터가 있으면(게스트로 쓰다 로그인한 경우 등) 절대 덮어쓰지 않고
//   '합치기'를 제안한다. 합치기는 양쪽 다 남기므로 이 시점에 잃는 데이터가 없다.
//
// 마커 2개를 쓴다.
// - logit.auto-restore.v1.<uid>: 자동 복원을 실제로 수행했을 때만 남긴다. 로컬 데이터
//   때문에 건너뛴 경우엔 남기지 않아, 나중에 로컬이 비면 자동 복원이 다시 살아난다.
// - logit.merge-prompt.v1.<uid>: 합치기 제안을 처리(합치기/나중에)하면 남긴다. 이후에는
//   제안도 Firestore 조회도 하지 않는다.
const restoredKey = (uid: string) => `logit.auto-restore.v1.${uid}`;
const promptKey = (uid: string) => `logit.merge-prompt.v1.${uid}`;

type Prompt = { backup: StoreState; updatedAt: number | null };
type Result = { title: string; message?: string };

export function CloudSyncGate() {
  const { user } = useAuth();
  const { ready, records, plans, customActivities, profile, onboardingComplete, preferredActivities, backupSignature, replaceAll } =
    useStore();

  // effect 안에서 최신 상태를 보되, 상태 변화로 effect가 재실행되지는 않게 ref로 읽는다.
  const snapshot = React.useRef<StoreState>({} as StoreState);
  snapshot.current = { records, plans, customActivities, profile, onboardingComplete, preferredActivities, backupSignature };

  const [prompt, setPrompt] = React.useState<Prompt | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);

  const isEmpty = () => {
    const s = snapshot.current;
    return s.records.length === 0 && s.plans.length === 0 && s.customActivities.length === 0;
  };

  React.useEffect(() => {
    if (!ready || !user) return;
    const uid = user.uid;
    let cancelled = false;

    void (async () => {
      try {
        if (await AsyncStorage.getItem(restoredKey(uid))) return;

        // 로컬이 비어 있음 → 마지막 백업을 그대로 내려받는다(덮어쓸 것이 없다).
        if (isEmpty()) {
          const backup = await fetchBackup(uid);
          if (cancelled || !backup?.data || !isEmpty()) return;
          await replaceAll({ ...backup.data, backupSignature: syncSignature(backup.data) });
          await AsyncStorage.setItem(restoredKey(uid), '1');
          return;
        }

        // 로컬에 데이터가 있음 → 덮어쓰지 않고 합치기를 제안한다.
        if (await AsyncStorage.getItem(promptKey(uid))) return;
        const backup = await fetchBackup(uid);
        if (cancelled || !backup?.data) return; // 백업이 없으면 제안할 것도 없다(마커도 남기지 않음)
        if (mergeTotal(mergeStoreStates(snapshot.current, backup.data).summary) === 0) {
          // 백업이 로컬의 부분집합 → 합칠 게 없다. 다시 묻지 않는다.
          await AsyncStorage.setItem(promptKey(uid), '1');
          return;
        }
        setPrompt({ backup: backup.data, updatedAt: backup.updatedAt });
      } catch (e) {
        // 네트워크·권한 오류는 마커를 남기지 않아 다음 실행에서 다시 시도한다.
        console.warn('[cloud-sync] 로그인 시 동기화 확인 실패', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.uid]);

  const labels = {
    records: tr({ en: 'records', ko: '기록' }),
    plans: tr({ en: 'plans', ko: '약속' }),
    activities: tr({ en: 'activities', ko: '활동' }),
  };

  const dismiss = async (merge: boolean) => {
    const target = prompt;
    setPrompt(null);
    if (!target || !user) return;
    try {
      if (merge) {
        const { next, summary } = mergeStoreStates(snapshot.current, target.backup);
        await replaceAll(next);
        setResult({
          title: tr({ en: 'Merged', ko: '합치기 완료' }),
          message: mergeMessage(summary, labels),
        });
      }
      await AsyncStorage.setItem(promptKey(user.uid), '1');
    } catch (e) {
      setResult({
        title: tr({ en: 'Merge failed', ko: '합치기 실패' }),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  };

  if (prompt) {
    const added = summaryText(mergeStoreStates(snapshot.current, prompt.backup).summary, labels);
    const when = prompt.updatedAt != null ? new Date(prompt.updatedAt).toLocaleString() : null;
    return (
      <ActionSheet
        visible
        title={tr({ en: 'Cloud backup found', ko: '클라우드에 이전 백업이 있어요' })}
        message={[
          when ? tr({ en: `Last backup: ${when}`, ko: `마지막 백업: ${when}` }) : null,
          tr({
            en: `Merging adds ${added} from the backup. Nothing on this device is removed.`,
            ko: `합치면 백업에서 ${added}를 가져옵니다. 이 기기의 기록은 그대로 유지돼요.`,
          }),
        ]
          .filter(Boolean)
          .join('\n')}
        cancelLabel={tr({ en: 'Later', ko: '나중에' })}
        onCancel={() => void dismiss(false)}
        actions={[{ label: tr({ en: 'Merge', ko: '합치기' }), onPress: () => void dismiss(true) }]}
      />
    );
  }

  if (result) {
    return (
      <ActionSheet
        visible
        title={result.title}
        message={result.message}
        cancelLabel={tr({ en: 'OK', ko: '확인' })}
        onCancel={() => setResult(null)}
        actions={[]}
      />
    );
  }

  return null;
}

// 합치기 결과 안내 — 백업이 필요해진 것도 같이 알린다.
function mergeMessage(summary: MergeSummary, labels: { records: string; plans: string; activities: string }): string {
  const added = summaryText(summary, labels);
  const head = added
    ? tr({ en: `Added ${added} from the backup.`, ko: `백업에서 ${added}를 가져왔어요.` })
    : tr({ en: 'Everything was already here.', ko: '이미 모두 가지고 있었어요.' });
  return added
    ? `${head}\n${tr({
        en: 'Back up in My → Cloud backup to save the merged data.',
        ko: '합친 데이터를 클라우드에도 남기려면 마이 → 클라우드 백업에서 백업해주세요.',
      })}`
    : head;
}

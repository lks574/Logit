import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { buildEnvelope, normalize } from './dataTransfer';
import { tr } from '../i18n/i18n';
import type { StoreState } from '../store/types';

// 클라우드 백업 — 사용자별 Firestore 문서 1개에 전체 기록(Envelope)을 저장한다.
// 파일 export와 동일한 봉투/검증 로직을 재사용(dataTransfer). 사진은 URI만 저장돼
// 기기 이전 시 이미지가 깨지는 한계는 파일 백업과 동일.
//
// ⚠️ Firestore 콘솔에서 DB 생성 + 보안 규칙 필요:
//   match /backups/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }

export type BackupInfo = { data: StoreState; updatedAt: number | null; counts: { records: number; plans: number } };

const backupRef = (uid: string) => doc(db, 'backups', uid);

// Firestore가 미설정(DB 미생성)이면 SDK가 무한 재시도해 요청이 걸린다 → 타임아웃으로 실패시킨다.
function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(tr({ en: 'Connection timed out. Is Firestore enabled?', ko: '연결 시간 초과. Firestore가 설정돼 있나요?' }))),
        ms,
      ),
    ),
  ]);
}

// 현재 상태를 업로드(덮어쓰기).
export async function backupNow(uid: string, state: StoreState): Promise<void> {
  const env = buildEnvelope(state);
  await withTimeout(
    setDoc(backupRef(uid), {
      ...env,
      updatedAt: serverTimestamp(),
      counts: { records: state.records.length, plans: state.plans.length },
    }),
  );
}

// 클라우드 백업 문서 삭제(계정 삭제 시). 없으면 no-op.
export async function deleteBackup(uid: string): Promise<void> {
  await withTimeout(deleteDoc(backupRef(uid)));
}

// 마지막 백업 조회. 없으면 null. 형식이 깨졌으면 throw(normalize).
export async function fetchBackup(uid: string): Promise<BackupInfo | null> {
  const snap = await withTimeout(getDoc(backupRef(uid)));
  if (!snap.exists()) return null;
  const raw = snap.data();
  const data = normalize(raw); // app/version/records 검증 — 실패 시 throw
  const ts = raw.updatedAt;
  const updatedAt = ts instanceof Timestamp ? ts.toMillis() : null;
  return {
    data,
    updatedAt,
    counts: {
      records: raw.counts?.records ?? data.records.length,
      plans: raw.counts?.plans ?? data.plans.length,
    },
  };
}

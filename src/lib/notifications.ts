import { Platform } from 'react-native';
import type * as NotificationsModule from 'expo-notifications';
import type { StoredPlan } from '../store/types';
import { tr } from '../i18n/i18n';

// 로컬 알림 — 약속 시작 1시간 전. plan.id를 알림 식별자로 써서 예약/취소가 idempotent.
// (원격 FCM/Expo push 토큰은 lib/push.ts. 권한/핸들러는 여기서 공용.)
//
// ⚠️ expo-notifications는 네이티브 모듈이라 재빌드 전 dev build엔 없을 수 있다 →
//    로드/호출을 전부 방어(없으면 no-op). 재빌드 후 자동으로 동작.

const REMINDER_OFFSET_MS = 60 * 60 * 1000; // 1시간 전

let N: typeof NotificationsModule | null | undefined;
function notif(): typeof NotificationsModule | null {
  if (N !== undefined) return N; // 1회만 시도(성공/실패 캐시)
  try {
    N = require('expo-notifications');
    // 포그라운드에서도 배너·목록·소리로 표시.
    N!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    N = null; // 네이티브 미탑재(재빌드 전) → 비활성
  }
  return N ?? null;
}

let asked = false;
export async function ensurePermission(): Promise<boolean> {
  const n = notif();
  if (!n) return false;
  try {
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('reminders', {
        name: tr({ en: 'Reminders', ko: '약속 알림' }),
        importance: n.AndroidImportance.HIGH,
      });
    }
    let { status } = await n.getPermissionsAsync();
    if (status !== 'granted' && !asked) {
      asked = true; // 세션당 1회만 시스템 프롬프트(거부 후 반복 요청 방지)
      status = (await n.requestPermissionsAsync()).status;
    }
    return status === 'granted';
  } catch {
    return false;
  }
}

// dateISO(YYYY-MM-DD) + timeLabel("오후 8:00") → 로컬 트리거 시각(시작 1시간 전). 미설정/파싱실패 → null.
export function planTriggerDate(plan: StoredPlan): Date | null {
  if (!plan.reminder || !plan.timeLabel) return null;
  const m = plan.timeLabel.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (!m) return null;
  let hour = parseInt(m[2], 10) % 12; // 12시 → 0
  if (m[1] === '오후') hour += 12; // 오후 → +12 (오후 12시=정오는 12 유지)
  const minute = parseInt(m[3], 10);
  const [y, mo, d] = plan.dateISO.split('-').map(Number);
  const start = new Date(y, mo - 1, d, hour, minute, 0, 0);
  return new Date(start.getTime() - REMINDER_OFFSET_MS);
}

// 약속 알림 재조정 — 기존 예약 취소 후, 유효하면(미래 시각) 다시 예약. 생성/수정 시 호출.
export async function syncPlanReminder(plan: StoredPlan): Promise<void> {
  const n = notif();
  if (!n) return;
  try {
    await cancelPlanReminder(plan.id);
    const when = planTriggerDate(plan);
    if (!when || when.getTime() <= Date.now()) return; // 알림 꺼짐·시간 미정·이미 지난 시각
    if (!(await ensurePermission())) return;
    await n.scheduleNotificationAsync({
      identifier: plan.id,
      content: {
        title: plan.activity,
        body: tr({ en: 'Starts in 1 hour.', ko: '1시간 뒤 시작해요.' }),
      },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: when },
    });
  } catch {
    // best-effort — 실패해도 앱 흐름엔 영향 없음
  }
}

export async function cancelPlanReminder(id: string): Promise<void> {
  const n = notif();
  if (!n) return;
  try {
    await n.cancelScheduledNotificationAsync(id);
  } catch {}
}
